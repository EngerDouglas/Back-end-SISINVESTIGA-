import express from 'express';
import { 
  createProyecto, 
  updateProyecto, 
  deleteProyecto, 
  getAllProyectos, 
  getProyectoById, 
  searchProyectos 
} from '../controllers/proyectoController.js'; 
import { auth } from '../middlewares/auth.js'; 
import { authRole } from '../middlewares/auth.js';

const ProyectosRouter = express.Router();

// Rutas para los proyectos
ProyectosRouter.post('/', auth, authRole(['Administrador']), createProyecto); // Solo un administrador puede crear proyectos
ProyectosRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), updateProyecto); // Administradores e Investigadores pueden actualizar
ProyectosRouter.delete('/:id', auth, authRole(['Administrador', 'Investigador']), deleteProyecto); // Administradores e Investigadores pueden hacer soft delete

ProyectosRouter.get('/', getAllProyectos); // Listar proyectos con paginación y filtro
ProyectosRouter.get('/:id', getProyectoById); // Obtener un proyecto por ID
ProyectosRouter.get('/search', searchProyectos); // Buscar proyectos por texto completo

export default ProyectosRouter;
