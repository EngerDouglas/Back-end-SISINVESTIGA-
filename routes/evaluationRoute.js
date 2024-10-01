import express from 'express';
import {
  createEvaluation,
  updateEvaluation,
  getEvaluationsByProject,
  deleteEvaluation,
  restoreEvaluation,
} from '../controllers/evaluationController.js';
import { auth } from '../middlewares/auth.js';
import { authRole } from '../middlewares/auth.js';

const EvaluationRouter = express.Router();

EvaluationRouter.post('/projects/:projectId', auth, authRole(['Administrador']), createEvaluation);

EvaluationRouter.put('/:evaluationId', auth, authRole(['Administrador']), updateEvaluation);

EvaluationRouter.get('/projects/:projectId', auth, getEvaluationsByProject);


EvaluationRouter.delete('/:evaluationId', auth, authRole(['Administrador']), deleteEvaluation);

EvaluationRouter.put('/:evaluationId/restore', auth, authRole(['Administrador']), restoreEvaluation);

export default EvaluationRouter;
