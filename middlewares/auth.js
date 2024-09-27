import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Role from '../models/Role.js'

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Obtenemos de aqui el token del local storage

    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SEC_KEY);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      throw new Error('Usuario no encontrado con el token proporcionado');
    }

    // Verificar si el usuario está deshabilitado
    if (user.isDisabled) {
      return res.status(403).json({ error: 'Este usuario está deshabilitado. Contacta al administrador.' });
    }
    
    const role = await Role.findById(user.role)
    if (!role) {
      throw new Error('Rol no encontrado')      
    }

    req.token = token
    req.user = user
    req.userRole = role.roleName
    next()
  } catch (error) {
    res.status(401).json({ error: 'Por favor, autentiquese.' })
  }
}

const authRole = (roles) => (req, res, next) => {
  if (roles.includes(req.userRole)) {
    next()
  } else {
    res.status(403).send({ error: 'Acceso denegado. Usted no cumple con el rol requerido' })
  }
}

export {
  auth, 
  authRole
}