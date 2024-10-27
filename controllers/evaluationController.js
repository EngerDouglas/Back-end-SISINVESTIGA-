import EvaluationService from '../services/evaluationService.js';
import { BadRequestError } from '../utils/errors.js';

// #region Crear Evaluaciones //
  export const createEvaluation = async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { puntuacion, comentarios } = req.body;
      
      if (puntuacion === undefined || comentarios === undefined) {
        throw new BadRequestError('Puntuación y comentarios son requeridos.');
      }

      const evaluation = await EvaluationService.createEvaluation(projectId, req.user._id, { puntuacion, comentarios }, req.userRole);
      res.status(201).json({ message: 'Evaluación creada exitosamente.', evaluation });
    } catch (error) {
      next(error);
    }
};
  // #endregion ***************************************** //

  // #region Actualizar Evaluaciones ******************* //
  export const updateEvaluation = async (req, res, next) => {
    try {
      const { evaluationId } = req.params;
      const { puntuacion, comentarios } = req.body;
      
      const evaluation = await EvaluationService.updateEvaluation(evaluationId, req.user._id, { puntuacion, comentarios }, req.userRole);
      res.status(200).json({ message: 'Evaluación actualizada exitosamente.', evaluation });
    } catch (error) {
      next(error);
    }
  }
   // #endregion ***************************************** //

  // #region Obtener Evaluaciones ******************* //

  export const getAllEvaluations = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const filter = {};
      if (search) {
        filter.$or = [
          { 'project.nombre': new RegExp(search, 'i') },
          { 'evaluator.nombre': new RegExp(search, 'i') },
          { 'evaluator.apellido': new RegExp(search, 'i') }
        ];
      }
  
      const evaluations = await EvaluationService.getAllEvaluations(filter, parseInt(page), parseInt(limit));
      res.status(200).json(evaluations);
    } catch (error) {
      next(error);
    }
  };

  // #endregion ***************************************** //

  // #region Obtener Evaluaciones por Proyecto ******************* //
  export const getEvaluationsByProject = async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const evaluations = await EvaluationService.getEvaluationsByProject(projectId);
      res.status(200).json(evaluations);
    } catch (error) {
      next(error);
    }
  };
  // #endregion ***************************************** //

  // #region Obtener Evaluaciones por Proyecto Por el Administrador ******************* //
  export const getEvaluationsByAdmin = async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const evaluations = await EvaluationService.getEvaluationsByAdmin(projectId);
      res.status(200).json(evaluations);
    } catch (error) {
      next(error);
    }
  };
  // #endregion ***************************************** //

  // #region Eliminar Evaluaciones *********************** //
  export const deleteEvaluation = async (req, res, next) => {
    try {
      const { evaluationId } = req.params;
      const result = await EvaluationService.deleteEvaluation(evaluationId, req.user._id, req.userRole);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
  // #endregion ***************************************** //

  // #region Restaurar Evaluaciones *********************** //
  export const restoreEvaluation = async (req, res, next) => {
    try {
      const { evaluationId } = req.params;
      const evaluation = await EvaluationService.restoreEvaluation(evaluationId, req.userRole);
      res.status(200).json({ message: 'Evaluación restaurada exitosamente.', evaluation });
    } catch (error) {
      next(error);
    }
  };

  // #endregion ***************************************** //

