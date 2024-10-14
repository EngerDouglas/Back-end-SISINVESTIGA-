import express from 'express'
import { createPublication, updatePublication, deletePublication, restorePublication, getAllPublications, getPubById, getPubByTitle, getUserPublications }  from '../controllers/publicationController.js'
import { auth, authRole } from '../middlewares/auth.js'
import { uploadFiles, handleMultipleFileUploads } from '../middlewares/fileUpload.js'
import { validateCreatePublication, validateUpdatePublication } from '../middlewares/validators.js'

const PublicationsRouter = express.Router()

const uploadFields = [
  { name: 'imagen', maxCount: 1 },
  { name: 'anexos', maxCount: 10 },
];

const uploadConfigs = [
  { name: 'imagen', folderName: 'publications' },
  { name: 'anexos', folderName: 'attachments' },
];

// Rutas para las publicaciones
PublicationsRouter.post(
  '/', 
  auth, 
  authRole(['Administrador' ,'Investigador']), 
  uploadFiles(uploadFields),
  handleMultipleFileUploads(uploadConfigs),
  validateCreatePublication, 
  createPublication)
PublicationsRouter.put(
  '/:id', 
  auth, 
  authRole(['Administrador', 'Investigador']), 
  uploadFiles(uploadFields),
  handleMultipleFileUploads(uploadConfigs),
  validateUpdatePublication, 
  updatePublication)
PublicationsRouter.delete('/:id', auth, authRole(['Administrador', 'Investigador']), deletePublication)
PublicationsRouter.put('/restore/:id', auth, authRole(['Administrador']), restorePublication); 

PublicationsRouter.get('/', getAllPublications)
PublicationsRouter.get('/me', auth, getUserPublications)
PublicationsRouter.get('/getpublication/:id', getPubById)
PublicationsRouter.get('/search', getPubByTitle)

export default PublicationsRouter