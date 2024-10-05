import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Role from '../models/Role.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Obtenemos de aqui el token del local storage

    if (!token) {
      throw new UnauthorizedError('Token de autenticación no encontrado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SEC_KEY);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado con el token proporcionado');
    }

    // Verificar si el usuario está deshabilitado
    if (user.isDisabled) {
      throw new ForbiddenError('Este usuario está deshabilitado. Contacta al administrador.');
    }
    
    const role = await Role.findById(user.role)
    if (!role) {
      throw new UnauthorizedError('Rol no encontrado')      
    }

    req.token = token
    req.user = user
    req.userRole = role.roleName
    next()
  } catch (error) {
    next(error)
    // res.status(401).json({ error: 'Por favor, autentiquese.' })
  }
}

export const authRole = (roles) => (req, res, next) => {
  if (roles.includes(req.userRole)) {
    next()
  } else {
    throw new ForbiddenError('Acceso denegado. Usted no cumple con el rol requerido')
  }
}