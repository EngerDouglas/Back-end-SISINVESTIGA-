import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { ForbiddenError } from '../utils/errors.js';

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SEC_KEY);
      const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

      if (user) {
        if (user.isDisabled) {
          throw new ForbiddenError('Este usuario está deshabilitado. Contacta al administrador.');
        }

        const role = await Role.findById(user.role);
        if (!role) {
          throw new ForbiddenError('Rol no encontrado');
        }

        req.user = user;
        req.userRole = role.roleName;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
