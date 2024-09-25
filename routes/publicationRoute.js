import express from 'express'
import { createPublication, deletePublication, getAllPublications, getPubById, getPubByTitle, getUserPublications, updatePublication }  from '../controllers/publicationController.js'
import { auth } from '../middlewares/auth.js'
import { authRole } from '../middlewares/auth.js'

const PublicationsRouter = express.Router()

// Rutas para las publicaciones
PublicationsRouter.post('/', auth, authRole(['Administrador' ,'Investigador']), createPublication)
PublicationsRouter.put('/:id', auth, authRole(['Administrador', 'Investigador']), updatePublication)
PublicationsRouter.delete('/:id', auth, authRole(['Administrador']), deletePublication)

PublicationsRouter.get('/', getAllPublications)
PublicationsRouter.get('/me', auth, getUserPublications)
PublicationsRouter.get('/getpublication/:id', getPubById)
PublicationsRouter.get('/titulo/:titulo', getPubByTitle)

export default PublicationsRouter