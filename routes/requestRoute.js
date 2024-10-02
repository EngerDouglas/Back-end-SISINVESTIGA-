import express from 'express';
import { 
  createRequest,
  updateRequest,
  deleteRequest,
  restoreRequest,
  getAllRequests,
  getUserRequests,
  getRequestById,
} from '../controllers/requestController.js'; 
import { auth } from '../middlewares/auth.js'; 
import { authRole } from '../middlewares/auth.js';

const RequestRouter = express.Router();

RequestRouter.post('/', auth, authRole(['Administrador', 'Investigador']), createRequest); 
RequestRouter.put('/:id', auth, updateRequest); 
RequestRouter.delete('/:id', auth, authRole(['Administrador']), deleteRequest); 
RequestRouter.put('/:id/restore', auth, authRole(['Administrador']), restoreRequest);

RequestRouter.get('/', auth, authRole(['Administrador']), getAllRequests); 
RequestRouter.get('/me', auth, getUserRequests); 
RequestRouter.get('/:id', auth, getRequestById);

export default RequestRouter;
