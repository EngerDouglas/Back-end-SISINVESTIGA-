import { validationResult } from 'express-validator';
import RoleService from '../services/roleService.js';
import { BadRequestError } from '../utils/errors.js';

// #region Creamos un nuevo roles ******************* //
export const createRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Error de validación', errors.array());
    }

    const role = await RoleService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //


// #region Actualizar los Roles ***************************** //
export const updateRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Error de validación', errors.array());
    }

    const { id } = req.params;
    const updatedRole = await RoleService.updateRole(id, req.body);
    res.status(200).json({ message: 'Rol actualizado correctamente', role: updatedRole });
  } catch (error) {
    next(error);
  }
};

// #endregion *************************************************************** //

// #region Eliminar un Rol ****************************************//
export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    await RoleService.deleteRole(id);
    res.status(200).json({ message: 'Rol eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// #endregion *************************************************************** //

// #region Restauramos un Rol ****************************************//
export const restoreRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restoredRole = await RoleService.restoreRole(id);
    res.status(200).json({ message: 'Rol restaurado correctamente', role: restoredRole });
  } catch (error) {
    next(error);
  }
};

// #endregion *************************************************************** //


// #region ***************** Seccion de busquedas ************************************************* //


//#region Obtener todos los roles ************************************** //
export const getRoles = async (req, res, next) => {
  try {
    const roles = await RoleService.getRoles();
    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

// #endregion *************************************************************** //

// #endregion Seccion de Busqueda *************************************************************** //