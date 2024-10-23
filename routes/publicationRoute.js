import express from 'express'
import { createPublication, updatePublication, updateAdmPublication, deletePublication, restorePublication, getAllPublications, getPubById, getPubByTitle, getUserPublications }  from '../controllers/publicationController.js'
import { auth, authRole } from '../middlewares/auth.js'
import { optionalAuth } from '../middlewares/optionalAuth.js'
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
  authRole(['Investigador']), 
  uploadFiles(uploadFields),
  handleMultipleFileUploads(uploadConfigs),
  validateUpdatePublication, 
  updatePublication)
PublicationsRouter.put(
  '/admin/:id', 
  auth, 
  authRole(['Administrador']), 
  validateUpdatePublication, 
  updateAdmPublication)
PublicationsRouter.delete('/:id', auth, authRole(['Administrador', 'Investigador']), deletePublication)
PublicationsRouter.put('/restore/:id', auth, authRole(['Administrador']), restorePublication); 

PublicationsRouter.get('/', optionalAuth, getAllPublications)
PublicationsRouter.get('/me', auth, getUserPublications)
PublicationsRouter.get('/getpublication/:id', optionalAuth, getPubById)
PublicationsRouter.get('/search', getPubByTitle)

export default PublicationsRouter