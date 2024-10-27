import express from 'express';
import { 
  createRequest,
  updateRequest,
  deleteRequest,
  restoreRequest,
  getAllRequests,
  getUserRequests,
  getRequestById,
  getRequestIdByAdmin,
} from '../controllers/requestController.js'; 
import { auth, authRole } from '../middlewares/auth.js'; 
import { ValidateCreateRequest, ValidateUpdateRequest } from '../middlewares/validators.js';

const RequestRouter = express.Router();

RequestRouter.post('/', auth, authRole(['Administrador', 'Investigador']), ValidateCreateRequest, createRequest); 
RequestRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), ValidateUpdateRequest, updateRequest); 
RequestRouter.delete('/:id', auth, authRole(['Administrador']), deleteRequest); 
RequestRouter.put('/:id/restore', auth, authRole(['Administrador']), restoreRequest);

RequestRouter.get('/', auth, authRole(['Administrador']), getAllRequests); 
RequestRouter.get('/admin/:id', auth, authRole(['Administrador']), getRequestIdByAdmin);
RequestRouter.get('/me', auth, getUserRequests); 
RequestRouter.get('/:id', auth, getRequestById);

export default RequestRouter;
