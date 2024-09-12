import express from 'express'
import { createRole, updateRole, getRoles, deleteRole } from '../controllers/roleController.js'
import { auth } from '../middlewares/auth.js'
import { authRole } from '../middlewares/auth.js'

const RolesRouter = express.Router()

// Rutas de los roles
RolesRouter.post('/', auth, authRole(['Administrador']), createRole)
RolesRouter.get('/', auth, authRole(['Administrador']), getRoles)
RolesRouter.put('/:id', auth, authRole(['Administrador']), updateRole)
RolesRouter.delete('/:id', auth, authRole(['Administrador']), deleteRole)

export default RolesRouter