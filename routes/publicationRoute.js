import express from 'express'
import { createPublication, updatePublication, deletePublication, restorePublication, getAllPublications, getPubById, getPubByTitle, getUserPublications }  from '../controllers/publicationController.js'
import { auth } from '../middlewares/auth.js'
import { authRole } from '../middlewares/auth.js'

const PublicationsRouter = express.Router()

// Rutas para las publicaciones
PublicationsRouter.post('/', auth, authRole(['Administrador' ,'Investigador']), createPublication)
PublicationsRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), updatePublication)
PublicationsRouter.delete('/:id', auth, authRole(['Administrador', 'Investigador']), deletePublication)
PublicationsRouter.post('/restore/:id', auth, authRole(['Administrador']), restorePublication); 

PublicationsRouter.get('/', getAllPublications)
PublicationsRouter.get('/me', auth, getUserPublications)
PublicationsRouter.get('/getpublication/:id', getPubById)
PublicationsRouter.get('/search', getPubByTitle)

export default PublicationsRouter