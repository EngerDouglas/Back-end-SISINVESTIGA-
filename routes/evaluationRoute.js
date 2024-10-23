import express from 'express';
import {
  createEvaluation,
  updateEvaluation,
  getAllEvaluations,
  getEvaluationsByProject,
  deleteEvaluation,
  restoreEvaluation,
} from '../controllers/evaluationController.js';
import { auth, authRole } from '../middlewares/auth.js';
import { validateCreateEvaluation, validateUpdateEvaluation } from '../middlewares/validators.js';

const EvaluationRouter = express.Router();

EvaluationRouter.post('/projects/:projectId', auth, authRole(['Administrador']), validateCreateEvaluation, createEvaluation);
EvaluationRouter.put('/:evaluationId', auth, authRole(['Administrador']), validateUpdateEvaluation, updateEvaluation);
EvaluationRouter.put('/:evaluationId/restore', auth, authRole(['Administrador']), restoreEvaluation);
EvaluationRouter.delete('/:evaluationId', auth, authRole(['Administrador']), deleteEvaluation);

EvaluationRouter.get('/all', auth, authRole(['Administrador']), getAllEvaluations);
EvaluationRouter.get('/projects/:projectId', auth, getEvaluationsByProject);

export default EvaluationRouter;
