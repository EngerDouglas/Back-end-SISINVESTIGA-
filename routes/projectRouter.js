import express from 'express';
import { 
  createProyecto, 
  updateProyecto, 
  deleteProyecto, 
  getAllProyectos, 
  getProyectoById, 
  searchProyectos 
} from '../controllers/projectController.js'; 
import { auth } from '../middlewares/auth.js'; 
import { authRole } from '../middlewares/auth.js';

const ProjectRouter = express.Router();

// Rutas para los proyectos
ProjectRouter.post('/', auth, authRole(['Administrador', 'Investigador']), createProyecto); // Solo un administrador puede crear proyectos
ProjectRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), updateProyecto); // Administradores e Investigadores pueden actualizar
ProjectRouter.delete('/:id', auth, authRole(['Administrador', 'Investigador']), deleteProyecto); // Administradores e Investigadores pueden hacer soft delete

ProjectRouter.get('/', getAllProyectos); // Listar proyectos con paginación y filtro
ProjectRouter.get('/search', searchProyectos); // Buscar proyectos por texto completo
ProjectRouter.get('/:id', getProyectoById); // Obtener un proyecto por ID

export default ProjectRouter;
