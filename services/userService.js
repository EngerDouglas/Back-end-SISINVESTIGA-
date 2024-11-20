import User from "../models/User.js";
import Role from "../models/Role.js";
import Session from "../models/Session.js";
import NotificationService from "../services/notificationService.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError, ForbiddenError, ManyRequest } from "../utils/errors.js";
import rateLimit from 'express-rate-limit';

class UserService {

  // #region *********************** Creando el Usuario ******************* //
  static async createUser(userData) {
    const existUser = await User.findOne({ email: userData.email })

    if (existUser) {
      throw new ConflictError('El email colocado ya existe.')
    }

    const roleDocument = await Role.findOne({ roleName: 'Investigador' })
    if (!roleDocument) {
      throw new BadRequestError('Rol no encontrado en la Base de Datos')
    }

    const newUser = new User({
      ...userData,
      role: roleDocument._id
    })

    newUser.generateVerificationToken();
    await newUser.save()

    // Obtener los administradores
    const adminRole = await Role.findOne({ roleName: 'Administrador' });
    const admins = await User.find({ role: adminRole._id }).select('_id');

    // Crear notificaciones para los administradores
    for (const admin of admins) {
      await NotificationService.createNotification({
        recipientId: admin._id,
        senderId: newUser._id,
        type: 'Usuario',
        message: `Se ha creado una nueva cuenta para el usuario ${newUser.nombre} ${newUser.apellido}.`,
        data: { userId: newUser._id },
      });
    }

    return newUser
  }
  // #endregion ****************************************************************** //

  // #region *********************** Verificar Token para Validacion de Usuario ******************* //
  static async verifyUser(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SEC_KEY);
    } catch (error) {
      throw new BadRequestError('Token inválido o expirado');
    }

    // Buscar al usuario
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new BadRequestError('Usuario no encontrado');
    }

    // Si el usuario ya está verificado
    if (user.isVerified) {
      return { alreadyVerified: true, user };
    }

    // Verificar si el token coincide y no ha expirado
    if (
      user.verificationToken !== token ||
      user.verificationTokenExpires < Date.now()
    ) {
      throw new BadRequestError('Token de verificación inválido o expirado');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Crear notificación para el usuario
    await NotificationService.createNotification({
      recipientId: user._id,
      senderId: user._id,
      type: 'Usuario',
      message: 'Tu correo electrónico ha sido verificado exitosamente.',
      data: { userId: user._id },
    });

    // Obtener los administradores
    const adminRole = await Role.findOne({ roleName: 'Administrador' });
    const admins = await User.find({ role: adminRole._id }).select('_id');

    // Crear notificaciones para los administradores
    for (const admin of admins) {
      await NotificationService.createNotification({
        recipientId: admin._id,
        senderId: user._id,
        type: 'Usuario',
        message: `El usuario ${user.nombre} ${user.apellido} ha verificado su cuenta.`,
        data: { userId: user._id },
      });
    }

    return { alreadyVerified: false, user };
  }

  // #endregion ****************************************************************** //

  // #region *********************** Iniciando Sesion ******************* //
  static loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limita cada usuario a 5 intentos de inicio de sesión por ventana
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.body.email || req.ip; // Usa el email como clave, o la IP si no está disponible
    },
    skip: (req) => {
      return req.successfulLogin === true;
    },
    handler: (req, res, next) => {
      const error = new ManyRequest('Demasiados intentos de inicio de sesión, por favor intente nuevamente después de 15 minutos');
      next(error);
    }
  });

  static async loginUser(email, password ) {
    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    if (user.isDisabled) {
      throw new ForbiddenError('El usuario está deshabilitado, contacta al administrador.');
    }

    if (!user.isVerified) {
      throw new ForbiddenError('Por favor, verifica tu cuenta antes de iniciar sesión.');
    }

    const isPassCorrect = await bcrypt.compare(password, user.password);
    if (!isPassCorrect) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const token = await user.generateAuthToken();
    return { user, token };
  }
  // #endregion ****************************************************************** //

  // #region *********************** Cerrando Sesion ******************* //

  static async logoutUser(user, token) {
    user.tokens = user.tokens.filter((userToken) => userToken.token !== token);
    await user.save();

    // Actualizar el estado `isActive` de la sesión correspondiente
    const sessionUpdated = await Session.updateOne(
      { user: user._id, token: token, isActive: true },
      { $set: { isActive: false } }
    );

    if (sessionUpdated.modifiedCount === 0) {
      console.warn("La sesión no se actualizó. Verifica los datos de entrada.");
    }
  }

  // #endregion ****************************************************************** //

  // #region *********************** Cerrando todas las Sesiones ******************* //
  static async logoutAllUser(user) {
    user.tokens = [];
    await user.save();

    // Actualizar todas las sesiones activas del usuario en la colección `Session` a `isActive: false`
    const sessionsUpdated = await Session.updateMany(
      { user: user._id, isActive: true },
      { $set: { isActive: false } }
    );

    if (sessionsUpdated.modifiedCount === 0) {
      console.warn("No se encontraron sesiones activas para actualizar.");
    }
  }

  // #endregion ****************************************************************** //

  // #region *********************** Actualizando el Usuario ******************* //
  static async updateUser(id, updates) {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (updates.currentPassword && updates.newPassword) {
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestError('Contraseña incorrecta');
      }
      user.password = updates.newPassword;
    }

    const allowedUpdates = [
      'nombre',
      'apellido',
      'email',
      'especializacion',
      'responsabilidades',
      'fotoPerfil',
    ];

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        if (key === 'responsabilidades' && typeof updates[key] === 'string') {
          user[key] = updates[key].split(',').map((res) => res.trim());
        } else {
          user[key] = updates[key];
        }
      }
    }

    await user.save();
    return user;
  }

  // #endregion ****************************************************************** //

  // #region *********************** Actualizar Rol del Usuario***************** //
  static async updateUserRole(userId, roleId, adminUserId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const role = await Role.findById(roleId);
    if (!role) {
      throw new BadRequestError('Rol no válido');
    }

    user.role = roleId;
    await user.save();
    await user.populate('role');

    // Crear notificación para el usuario
    await NotificationService.createNotification({
      recipientId: user._id,
      senderId: adminUserId,
      type: 'Rol',
      message: `Tu rol ha sido actualizado a "${user.role.roleName}".`,
      data: { userId: user._id },
    });

    return user;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Actualizando tu propio Usuario ******************* //
  static async updateSelfUser(user, updates) {
    if (updates.currentPassword && updates.newPassword) {
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestError('Contraseña incorrecta');
      }
      user.password = updates.newPassword;
    }

    const allowedUpdates = ['nombre', 'apellido', 'email', 'especializacion', 'responsabilidades', 'fotoPerfil'];
    // Actualizar campos permitidos
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        if (key === 'responsabilidades' && typeof updates[key] === 'string') {
          user[key] = updates[key].split(',').map((res) => res.trim());
        } else {
          user[key] = updates[key];
        }
      }
    }

    if (updates.email && updates.email !== user.email) {
      const emailExists = await User.findOne({ email: updates.email });
      if (emailExists) {
        throw new ConflictError('El email proporcionado ya está en uso');
      }
    }

    await user.save();
    await user.populate('role', 'roleName');

    // Crear notificación para el usuario
    await NotificationService.createNotification({
      recipientId: user._id,
      senderId: user._id,
      type: 'Usuario',
      message: 'Has actualizado tu información de usuario.',
      data: { userId: user._id },
    });

    return user;
  }

  // #endregion ****************************************************************** //

  // #region *********************** Deshabilitando el Usuario ******************* //
  static async disableUser(id, adminUserId, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para deshabilitar este usuario.');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (user.isDisabled) {
      throw new BadRequestError('Este usuario ya está deshabilitado.');
    }

    user.isDisabled = true;

    await user.save();

    // Crear notificación para el usuario
    await NotificationService.createNotification({
      recipientId: user._id,
      senderId: adminUserId,
      type: 'Usuario',
      message: 'Tu cuenta ha sido deshabilitada.',
      data: { userId: user._id },
    });

    return user;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Habilitando el Usuario ******************* //
  static async enableUser(id, adminUserId, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para habilitar este usuario.');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (!user.isDisabled) {
      throw new BadRequestError('Este usuario ya está habilitado.');
    }

    user.isDisabled = false;

    await user.save();

    // Crear notificación para el usuario
    await NotificationService.createNotification({
      recipientId: user._id,
      senderId: adminUserId,
      type: 'Usuario',
      message: 'Tu cuenta ha sido habilitada.',
      data: { userId: user._id },
    });

    return user;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Creamos el token para resetear la clave ******************* //
  static async createPasswordResetToken(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    user.generatePasswordResetToken();
    await user.save();
    return user;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Resetamos la clave del usuario ******************* //
  static async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SEC_KEY);
      const user = await User.findOne({
        _id: decoded._id,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        throw new BadRequestError('Token inválido o expirado');
      }
  
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Crear notificación para el usuario
      await NotificationService.createNotification({
        recipientId: user._id,
        senderId: user._id,
        type: 'Usuario',
        message: 'Tu contraseña ha sido restablecida exitosamente.',
        data: { userId: user._id },
      });

      // Obtener los administradores
      const adminRole = await Role.findOne({ roleName: 'Administrador' });
      const admins = await User.find({ role: adminRole._id }).select('_id');

      // Crear notificaciones para los administradores
      for (const admin of admins) {
        await NotificationService.createNotification({
          recipientId: admin._id,
          senderId: user._id,
          type: 'Usuario',
          message: `El usuario ${user.nombre} ${user.apellido} ha restablecido su contraseña.`,
          data: { userId: user._id },
        });
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestError('Token inválido');
      }
      throw error;
    }
  }
  // #endregion ****************************************************************** //

  // #region *********************** Filtros para las busquedas ************************************************ //

  // #region *********************** Buscando tu propio usuario ******************* //
  static async getUser(id) {
    const user = await User.findById(id)
    .select('-password -tokens')
    .populate('role', 'roleName')
    .populate('proyectos')
    .populate('publicaciones')
    .populate('requests');

    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    // Obtener la última sesión activa del usuario
    const lastSession = await Session.findOne({ user: id })
      .sort({ createdAt: -1 })
      .select('createdAt');

    // Convertir el documento de usuario a objeto y agregar lastLogin
    const userObject = user.toObject();
    userObject.lastLogin = lastSession ? lastSession.createdAt : null;

    return userObject;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Buscando todos los usuarios ******************* //
  static async getAllUsers() {
    const users = await User.find()
      .select('-__v')
      .populate('role', 'roleName')
      .populate('proyectos')
      .populate('publicaciones')
      .populate('requests');

      const usersWithSessions = await Promise.all(users.map(async (user) => {
        const sessions = await Session.find({ user: user._id, isActive: true });
        return {
          ...user.toObject(),
          sessions,
        };
      }));

      return usersWithSessions;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Buscando usuario por ID ******************* //
  static async getUserById(id) {
    const user = await User.findById(id)
      .select('-__v')
      .populate('role', 'roleName')
      .populate('proyectos')
      .populate('publicaciones')
      .populate('requests');

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  // #endregion ****************************************************************** //

  // #endregion Filtro Busqueda ****************************************************************** //
}

export default UserService