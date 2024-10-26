import Role from '../models/Role.js';
import User from '../models/User.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

class RoleService {
  // #region ***********************  Creamos un nuevo roles ******************* //
  static async createRole(roleData) {
    const existingRole = await Role.findOne({ roleName: roleData.roleName });
    if (existingRole) {
      // Si el rol existe pero está eliminado, lo restauramos
      if (existingRole.isDeleted) {
        existingRole.isDeleted = false;
        await existingRole.save();
        return existingRole;
      }
      throw new ConflictError('El rol ya existe');
    }
    // Crear y guardar el nuevo rol
    const role = new Role(roleData);
    await role.save();
    return role;
  }
  // #endregion ****************************************************************** //

  // #region*********************** Actualizar los Roles ******************* //
  static async updateRole(id, roleData) {
    // Verificar si el rol existe y no está eliminado
    const role = await Role.findById(id);
    if (!role || role.isDeleted) {
      throw new NotFoundError('Rol no encontrado');
    }

    // Verificar si otro rol con el mismo nombre ya existe
    const existingRole = await Role.findOne({
      roleName: roleData.roleName,
      _id: { $ne: id }, // Excluimos el rol actual
    });

    if (existingRole) {
      throw new ConflictError('El rol suministrado ya existe');
    }
    
    role.roleName = roleData.roleName || role.roleName;

    await role.save();
    return role;
  }

  // #endregion ****************************************************************** //

  // #region *********************** Obtener todos los roles ******************* //
  static async getRoles() {
    return Role.find().select('-__v');
  }
  // #endregion ****************************************************************** //

  // #region ********************************* Eliminar un Rol ******************//
  static async deleteRole(id) {
    // Buscar el rol por ID
    const role = await Role.findById(id);
    if (!role || role.isDeleted) {
      throw new NotFoundError('Rol no encontrado');
    }

    // Verificar si hay usuarios asignados a este rol
    const userWithRole = await User.findOne({ role: id });
    if (userWithRole) {
      throw new BadRequestError('No se puede eliminar el rol porque está asignado a uno o más usuarios');
    }

    // Eliminación lógica del rol (establecer isDeleted a true)
    role.isDeleted = true;
    await role.save();
  }
  // #endregion ****************************************************************** //

  // #region ********************************* Restaurar un Rol ****************//
  static async restoreRole(id) {
    const role = await Role.findById(id);
    if (!role) {
      throw new NotFoundError('Rol no encontrado');
    }

    // Verificamos si el rol ya está activo
    if (!role.isDeleted) {
      throw new BadRequestError('El rol ya está activo');
    }

    // Restauramos el rol
    role.isDeleted = false;
    await role.save();

    return role;
  }
  // #endregion ****************************************************************** //
}

export default RoleService;