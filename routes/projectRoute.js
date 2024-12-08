import express from 'express';
import { 
  createProyecto, 
  updateProyecto, 
  updateProyectoByInvestigator,
  deleteProyecto, 
  restoreProyecto,
  getAllProyectos, 
  getUserProyectos,
  getProyectoById, 
  searchProyectos 
} from '../controllers/projectController.js'; 
import { auth, authRole } from '../middlewares/auth.js'; 
import { uploadImages, handleFileUpload } from '../middlewares/fileUpload.js';
import { validateCreateProject, validateUpdateProject } from '../middlewares/validators.js';

const ProjectRouter = express.Router();

// Rutas para los proyectos
ProjectRouter.post(
  '/', 
  auth,   
  authRole(['Administrador', 'Investigador']), 
  uploadImages('imagen', 1),
  handleFileUpload('projects', 'imagen'),
  validateCreateProject, 
  createProyecto); 
ProjectRouter.put(
  '/:id', 
  auth, 
  authRole(['Administrador']), 
  uploadImages('imagen', 1),
  handleFileUpload('projects', 'imagen'),
  validateUpdateProject, 
  updateProyecto
); 
ProjectRouter.put(
  '/investigator/:id',
  auth,
  authRole(['Investigador']),
  uploadImages('imagen', 1),
  handleFileUpload('projects', 'imagen'),
  validateUpdateProject,
  updateProyectoByInvestigator
);
ProjectRouter.delete('/:id', auth, authRole(['Administrador', 'Investigador']), deleteProyecto); 
ProjectRouter.put('/restore/:id', auth, authRole(['Administrador']), restoreProyecto); 

ProjectRouter.get('/', getAllProyectos); 
ProjectRouter.get('/me', auth, getUserProyectos); 
ProjectRouter.get('/search', searchProyectos); 
ProjectRouter.get('/:id', getProyectoById); 

export default ProjectRouter;
