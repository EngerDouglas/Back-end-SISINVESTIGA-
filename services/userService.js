import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError, ForbiddenError,  } from "../utils/errors.js";

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

    await newUser.save()
    return newUser
  }
  // *********************** END ******************* //

  // *********************** Iniciando Sesion ******************* //
  static async loginUser(email, password){
    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    if (user.isDisabled) {
      throw new ForbiddenError('El usuario está deshabilitado, contacta al administrador.');
    }

    const isPassCorrect = await bcrypt.compare(password, user.password);
    if (!isPassCorrect) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const token = await user.generateAuthToken();
    return { user, token };
  }

  static async logoutUser(user, token) {
    user.tokens = user.tokens.filter((userToken) => userToken.token !== token);
    await user.save();
  }

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