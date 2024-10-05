import EvaluationService from '../services/evaluationService.js';
import { BadRequestError } from '../utils/errors.js';

  // ***********************  Creamos la Evaluacion ******************* //
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
  // ***********************  END ******************* //

  // ***********************  Actualizamos la Evaluacion ******************* //
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
  // ***********************  END ******************* //

  // ***********************  Obtenemos la Evaluacion por Proyecto ******************* //
  export const getEvaluationsByProject = async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const evaluations = await EvaluationService.getEvaluationsByProject(projectId);
      res.status(200).json(evaluations);
    } catch (error) {
      next(error);
    }
  };
  // ***********************  END ******************* //

  // ***********************  Eliminamos la Evaluacion ******************* //
  export const deleteEvaluation = async (req, res, next) => {
    try {
      const { evaluationId } = req.params;
      const result = await EvaluationService.deleteEvaluation(evaluationId, req.user._id, req.userRole);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
  // ***********************  END ******************* //

  // ***********************  Restauramos la Evaluacion ******************* //
  export const restoreEvaluation = async (req, res, next) => {
    try {
      const { evaluationId } = req.params;
      const evaluation = await EvaluationService.restoreEvaluation(evaluationId, req.userRole);
      res.status(200).json({ message: 'Evaluación restaurada exitosamente.', evaluation });
    } catch (error) {
      next(error);
    }
  };

