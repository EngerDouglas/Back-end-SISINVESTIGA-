import express from 'express';
import { 
  createSolicitud, 
  updateSolicitud, 
  deleteSolicitud, 
  getAllSolicitudes, 
  getSolicitudById 
} from '../controllers/solicitudController.js'; 
import { auth } from '../middlewares/auth.js'; 
import { authRole } from '../middlewares/auth.js';

const SolicitudRouter = express.Router();

// Rutas para las solicitudes
SolicitudRouter.post('/', auth, authRole(['Administrador', 'Investigador']), createSolicitud); // Crear solicitud (Investigadores y Administradores)
SolicitudRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), updateSolicitud); // Actualizar solicitud (Investigadores y Administradores)
SolicitudRouter.delete('/:id', auth, authRole(['Administrador']), deleteSolicitud); // Eliminar solicitud (solo Administradores)

SolicitudRouter.get('/', auth, authRole(['Administrador', 'Investigador']), getAllSolicitudes); // Listar solicitudes con paginación y filtros (Investigadores y Administradores)
SolicitudRouter.get('/:id', auth, authRole(['Administrador', 'Investigador']), getSolicitudById); // Obtener una solicitud por ID (Investigadores y Administradores)

export default SolicitudRouter;
