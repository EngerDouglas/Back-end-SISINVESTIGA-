import express from 'express'
import { createRole, updateRole, getRoles, deleteRole } from '../controllers/roleController.js'
import { auth, authRole } from '../middlewares/auth.js'
import { validateCreateRole, validateUpdateRole } from '../middlewares/validators.js'

const RolesRouter = express.Router()

// Rutas de los roles
RolesRouter.post('/', auth, authRole(['Administrador']), validateCreateRole, createRole)
RolesRouter.get('/', auth, authRole(['Administrador']), getRoles)
RolesRouter.put('/:id', auth, authRole(['Administrador']), updateRole, validateUpdateRole)
RolesRouter.delete('/:id', auth, authRole(['Administrador']), deleteRole)

export default RolesRouter