import express from 'express';
import {
  createEvaluation,
  updateEvaluation,
  getEvaluationsByProject,
  deleteEvaluation,
  restoreEvaluation,
} from '../controllers/evaluationController.js';
import { auth, authRole } from '../middlewares/auth.js';
import { validateCreateEvaluation, validateUpdateEvaluation } from '../middlewares/validators.js';

const EvaluationRouter = express.Router();

EvaluationRouter.post('/projects/:projectId', auth, authRole(['Administrador']), validateCreateEvaluation, createEvaluation);

EvaluationRouter.put('/:evaluationId', auth, authRole(['Administrador']), validateUpdateEvaluation, updateEvaluation);

EvaluationRouter.get('/projects/:projectId', auth, getEvaluationsByProject);


EvaluationRouter.delete('/:evaluationId', auth, authRole(['Administrador']), deleteEvaluation);

EvaluationRouter.put('/:evaluationId/restore', auth, authRole(['Administrador']), restoreEvaluation);

export default EvaluationRouter;
