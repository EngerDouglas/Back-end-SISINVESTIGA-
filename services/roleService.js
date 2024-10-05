import Role from '../models/Role.js';
import User from '../models/User.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

class RoleService {
  static async createRole(roleData) {
    const existingRole = await Role.findOne({ roleName: roleData.roleName });
    if (existingRole) {
      throw new ConflictError('El rol ya existe');
    }
    const role = new Role(roleData);
    await role.save();
    return role;
  }

  static async updateRole(id, roleData) {
    const existingRole = await Role.findOne({
      roleName: roleData.roleName,
      _id: { $ne: id }
    });

    if (existingRole) {
      throw new ConflictError('El rol suministrado ya existe');
    }

    const updatedRole = await Role.findByIdAndUpdate(id, roleData, {
      new: true,
      runValidators: true,
    });

    if (!updatedRole) {
      throw new NotFoundError('Rol no encontrado');
    }

    return updatedRole;
  }

  static async getRoles() {
    return Role.find().select('-_id -__v');
  }

  static async deleteRole(id) {
    const role = await Role.findById(id);
    if (!role) {
      throw new NotFoundError('Rol no encontrado');
    }

    const userWithRole = await User.find({ role: id });
    if (userWithRole.length > 0) {
      throw new BadRequestError('No se puede eliminar el rol porque está asignado a uno o más usuarios');
    }

    await Role.findByIdAndDelete(id);
  }
}

export default RoleService;