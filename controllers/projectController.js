import { validationResult } from 'express-validator';
import ProjectService from '../services/projectService.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { BadRequestError } from '../utils/errors.js';

// #region Crear Proyecto ************************************************* //
export const createProyecto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Error de validación', errors.array());
    }

    if (req.body.imagen) {
      req.body.imagen = req.body.imagen;
    }

    const user = req.user;

    const project = await ProjectService.createProject(req.body, req.user._id);

    await emailService.sendProjectCreationEmail(user, project)

    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto: project,
    });

  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Actualizar Proyecto ************************************************* //
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
// #endregion *************************************************************** //

// #region Eliminar Proyecto (Soft Delete) ************************************************* //

export const deleteProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.deleteProject(id, req.user._id, req.userRole);

    // Obtener el investigador principal o "creador"
    const projectOwner = await User.findById(project.investigadores[0]);
    const isAdmin = req.userRole === "Administrador";

    // Enviar el correo de eliminación
    await emailService.sendProjectDeletedEmail(projectOwner, project, isAdmin);

    res.status(200).json({ message: 'Proyecto eliminado (soft delete).' });
  } catch (error) {
    next(error);
  }
};

// #endregion *************************************************************** //

// #region Restaurar Proyecto (Soft Delete) ************************************************* //
export const restoreProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.restoreProject(id, req.user._id, req.userRole);

    // Obtener el investigador principal o "creador"
    const projectOwner = await User.findById(project.investigadores[0]);

    // Enviar el correo de restauración
    await emailService.sendProjectRestoredEmail(projectOwner, project);

    res.status(200).json({ message: 'Proyecto restaurado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

// #endregion *************************************************************** //

// #region ***************** Seccion de busquedas ************************************************* //

// #region Obtener todos los Proyectos por Paginación y Filtrado ************************************************* //
export const getAllProyectos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, search, selectedProjects, selectedResearchers, startDate, endDate, isDeleted } = req.query;
    const filters = {
      estado,
      search,
      selectedProjects: selectedProjects ? selectedProjects.split(',') : [],
      selectedResearchers: selectedResearchers ? selectedResearchers.split(',') : [],
      startDate,
      endDate,
      isDeleted
    };

    const projects = await ProjectService.getAllProjects(filters, parseInt(page), parseInt(limit));
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Obtener Proyecto por ID ************************************************* //
export const getProyectoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Obtener Proyectos propios ************************************************* //
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
// #endregion *************************************************************** //

// #region Búsqueda avanzada por texto completo ************************************************* //
export const searchProyectos = async (req, res, next) => {
  try {
    const { query } = req.query;
    const projects = await ProjectService.searchProjects(query);
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #endregion *************************************************************** //