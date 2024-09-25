import express from 'express';
import { 
  createRequest, 
  updateRequest, 
  deleteRequest, 
  getAllRequests, 
  getRequestById 
} from '../controllers/requestController.js'; 
import { auth } from '../middlewares/auth.js'; 
import { authRole } from '../middlewares/auth.js';

const RequestRouter = express.Router();

// Rutas para las solicitudes
RequestRouter.post('/', auth, authRole(['Administrador', 'Investigador']), createRequest); // Crear solicitud (Investigadores y Administradores)
RequestRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), updateRequest); // Actualizar solicitud (Investigadores y Administradores)
RequestRouter.delete('/:id', auth, authRole(['Administrador']), deleteRequest); // Eliminar solicitud (solo Administradores)

RequestRouter.get('/', auth, authRole(['Administrador', 'Investigador']), getAllRequests); // Listar solicitudes con paginación y filtros (Investigadores y Administradores)
RequestRouter.get('/:id', auth, authRole(['Administrador', 'Investigador']), getRequestById); // Obtener una solicitud por ID (Investigadores y Administradores)

export default RequestRouter;
