import { validationResult } from 'express-validator';
import ProjectService from '../services/projectService.js';
import { BadRequestError } from '../utils/errors.js';

// **************************** Crear Proyecto ************************************************* //
export const createProyecto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Error de validación', errors.array());
    }

    if (req.body.imagen) {
      req.body.imagen = req.body.imagen;
    }

    const project = await ProjectService.createProject(req.body, req.user._id);
    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto: project,
    });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Actualizar Proyecto ************************************************* //
export const updateProyecto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Error de validación', errors.array());
    }

    const { id } = req.params;

    if (req.body.imagen) {
      req.body.imagen = req.body.imagen;
    }
    
    const project = await ProjectService.updateProject(id, req.body, req.user._id, req.userRole);
    res.status(200).json({
      message: 'Proyecto actualizado correctamente',
      proyecto: project
    });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Eliminar Proyecto (Soft Delete) ************************************************* //

export const deleteProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ProjectService.deleteProject(id, req.user._id, req.userRole);
    res.status(200).json({ message: 'Proyecto eliminado (soft delete).' });
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************ //

// **************************** Restaurar Proyecto (Revertir Soft Delete) ************************************************* //
export const restoreProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ProjectService.restoreProject(id, req.userRole);
    res.status(200).json({ message: 'Proyecto restaurado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************ //

// **************************** Seccion de busquedas ************************************************* //

// **************************** Obtener todos los Proyectos con Paginación y Filtrado ************************************************* //
export const getAllProyectos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, nombre } = req.query;
    const filter = {};
    if (estado) filter.estado = estado;
    if (nombre) filter.nombre = new RegExp(nombre, 'i');

    const projects = await ProjectService.getAllProjects(filter, parseInt(page), parseInt(limit));
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Obtener Proyecto por ID ************************************************* //
export const getProyectoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //

// **************************** Obtener Proyectos propios ************************************************* //
export const getUserProyectos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const { projects, totalProjects } = await ProjectService.getUserProjects(req.user._id, page, limit, search);
    res.status(200).json({
      total: totalProjects,
      page: Number(page),
      limit: Number(limit),
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //

// **************************** Búsqueda avanzada por texto completo ************************************************* //
export const searchProyectos = async (req, res, next) => {
  try {
    const { query } = req.query;
    const projects = await ProjectService.searchProjects(query);
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //
