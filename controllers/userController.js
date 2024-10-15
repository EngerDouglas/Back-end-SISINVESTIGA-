import UserService from '../services/userService.js'
import emailService from '../services/emailService.js';
import { BadRequestError } from '../utils/errors.js';
import geoip from 'geoip-lite';
import useragent from 'express-useragent';

// *********************** Creando el Usuario ******************* //
export const createUser = async (req, res, next) => {
  try {  
    const { nombre, apellido, email, password, especializacion, responsabilidades, fotoPerfil } = req.body;

    // Verificamos si el arreglo 'responsabilidades' está vacío antes de crear el usuario
    if (!responsabilidades || responsabilidades.length === 0) {
      throw new BadRequestError('Debe incluir al menos una responsabilidad.');
    }

    const user = await UserService.createUser({ nombre, apellido, email, password, especializacion, responsabilidades, fotoPerfil })

    const verificationLink = `${req.headers.origin}/verify-email/${user.verificationToken}`;
    await emailService.sendVerificationEmail(user, verificationLink);

    res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.', user })
  } catch (error) {
    next(error)
  }
};

// *********************** END ******************* //

// *********************** Verificar Email ******************* //

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    let result;
    try {
      result = await UserService.verifyUser(token);
    } catch (error) {
      throw new BadRequestError(error.message);
    }

    const { alreadyVerified, user } = result;

    if (alreadyVerified) {
      return res.status(200).json({ message: 'Tu email ya ha sido verificado. Ahora puedes iniciar sesión.' });
    }

    await emailService.sendRegistrationConfirmation(user);
    res.status(200).json({ message: 'Email verificado exitosamente. Ahora puedes iniciar sesión.' });
  } catch (error) {
    next(error);
  }
};

// *********************** END ******************* //

// *********************** Log In ******************* //

// Iniciar la sesion de los usuarios
export const logInUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await UserService.loginUser(email, password);

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    const ua = useragent.parse(req.headers['user-agent']);

    const loginInfo = {
      location: geo ? `${geo.city}, ${geo.country}` : 'Ubicación desconocida',
      ipAddress: ip,
      device: `${ua.browser} on ${ua.os}`,
    };
    
    await emailService.sendLoginNotification(user, loginInfo);

    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      token,
      role: user.role.roleName,
      user: {
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido
      }
    });
  } catch (error) {
    next(error);
  }
}

// *********************** END ******************* //


// *********************** Log Out ******************* //

export const logOutUser = async (req, res, next) => {
  try {
    await UserService.logoutUser(req.user, req.token);
    res.status(200).send({ message: 'Cierre de sesion exitoso' });
  } catch (error) {
    next(error);
  }
}

// *********************** END ******************* //


// *********************** Log Out All Devices ******************* //

export const logOutAllUser = async (req, res, next) => {
  try {
    await UserService.logoutAllUser(req.user);
    res.status(200).send({ message: 'Todas las sesiones han sido cerrada exitosamente.' });
  } catch (error) {
    next(error);
  }
}

// *********************** END ******************* //

// *********************** Actualizar Usuarios por el Administrador ******************* //

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = await UserService.updateUser(id, updates);
    res.status(200).json({ message: 'Usuario actualizado correctamente', user });
  } catch (error) {
    next(error);
  }
}
// *********************** END ******************* //

// ************************** Actualizar tu propio Usuario ******************************* //

export const updateSelfUser = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await UserService.updateSelfUser(req.user, updates);
    res.status(200).json({ message: 'Información actualizada correctamente', user });
  } catch (error) {
    next(error);
  }
}
// ************************** END ******************************* //


// ************************** Filtros y Busquedas para los Usuarios ******************************* //


// *********************** Buscar tu propio usuario ******************* //

export const getUser = async (req, res, next) => {
  try {
    const user = await UserService.getUser(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}
// ****************************** END *************************** //

// *********************** Buscar Todos los usuarios ******************* //

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}
// *********************** END ******************* //

// *********************** Buscar por ID ******************* //

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

// *********************** END ******************* //

// ************************** END de los Filtros ******************************* //


// *********************** Disabling Users ******************* //

export const disableUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserService.disableUser(id, req.userRole);
    res.status(200).json({ message: 'Usuario deshabilitado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

// *********************** END ******************* //


// *********************** Enabling Users ******************* //

export const enableUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserService.enableUser(id, req.userRole);
    res.status(200).json({ message: 'Usuario habilitado exitosamente.' });
  } catch (error) {
    next(error);
  }
};
// *********************** END ******************* //

// *********************** Olvide Contraseña ******************* //
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await UserService.createPasswordResetToken(email);
    
    const resetLink = `${req.headers.origin}/reset-password/${user.resetPasswordToken}`;
    
    await emailService.sendForgotPasswordEmail(user, resetLink);
    
    res.status(200).json({ message: 'Se ha enviado un correo para restablecer la contraseña' });
  } catch (error) {
    next(error);
  }
};
// *********************** END ******************* //

// *********************** Reestablecer Contraseña ******************* //
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await UserService.resetPassword(token, password);
    
    await emailService.sendResetPasswordConfirmationEmail(user);
    
    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword controller:', error);
    next(error);
  }
};
// *********************** END ******************* //