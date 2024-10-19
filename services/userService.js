import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError, ForbiddenError, ManyRequest } from "../utils/errors.js";
import rateLimit from 'express-rate-limit';

class UserService {

  // *********************** Creando el Usuario ******************* //
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
    return newUser
  }
  // *********************** END ******************* //

  // *********************** Verificar Token para Validacion de Usuario ******************* //

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
    return { alreadyVerified: false, user };
  }

  // *********************** END ******************* //

  // *********************** Iniciando Sesion ******************* //
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

  static async loginUser(email, password, ip) {
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
  // *********************** END ******************* //

  // *********************** Cerrando Sesion ******************* //

  static async logoutUser(user, token) {
    user.tokens = user.tokens.filter((userToken) => userToken.token !== token);
    await user.save();
  }

  // *********************** END ******************* //

  // *********************** Cerrando todas las Sesiones ******************* //
  static async logoutAllUser(user) {
    user.tokens = [];
    await user.save();
  }

  // *********************** END ******************* //

  // *********************** Actualizando el Usuario ******************* //

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

    if (updates.roleName) {
      const roleDocument = await Role.findOne({ roleName: updates.roleName });
      if (!roleDocument) {
        throw new BadRequestError('Rol no válido');
      }
      user.role = roleDocument._id;
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

    await user.save();
    await user.populate('role', 'roleName -_id');
    return user;
  }

  // *********************** END ******************* //

  // *********************** Actualizando tu propio Usuario ******************* //

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
    await user.populate('role', 'roleName -_id');
    return user;
  }

  // *********************** END ******************* //

  // *********************** Filtros para las busquedas ******************* //

  // *********************** Buscando tu propio usuario ******************* //
  static async getUser(id) {
    return User.findById(id)
      .select('-password -tokens')
      .populate('role', 'roleName')
      .populate('proyectos')
      .populate('publicaciones')
      .populate('requests');
  }
  // ***********************END ******************* //

  // *********************** Buscando todos los usuarios ******************* //
  static async getAllUsers() {
    return User.find()
      .select('-__v')
      .populate('role', 'roleName -_id')
      .populate('proyectos')
      .populate('publicaciones')
      .populate('requests');
  }
  // *********************** END ******************* //

  // *********************** Buscando usuario por ID ******************* //

  static async getUserById(id) {
    const user = await User.findById(id)
      .select('-__v')
      .populate('role', 'roleName -_id')
      .populate('proyectos')
      .populate('publicaciones')
      .populate('requests');

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  // *********************** END ******************* //

  // *********************** Deshabilitando el Usuario ******************* //
  static async disableUser(id, userRole) {
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
  }
  // *********************** END ******************* //

  // *********************** Habilitando el Usuario ******************* //
  static async enableUser(id, userRole) {
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
  }
  // *********************** END ******************* //

    // *********************** Creamos el token para resetear la clave ******************* //
    static async createPasswordResetToken(email) {
      const user = await User.findOne({ email });
      if (!user) {
        throw new NotFoundError('Usuario no encontrado');
      }
      user.generatePasswordResetToken();
      await user.save();
      return user;
    }
    // *********************** END ******************* //

    // *********************** Resetamos la clave del usuario ******************* //
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
        return user;
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          throw new BadRequestError('Token inválido');
        }
        throw error;
      }
    }
    // *********************** END ******************* //

}

export default UserService