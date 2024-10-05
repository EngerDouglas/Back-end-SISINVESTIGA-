import express from 'express'
import { createUser, logInUser, logOutUser, logOutAllUser, updateUser, updateSelfUser, getUser, getAllUsers, getUserById, disableUser, enableUser } from '../controllers/userController.js'
import { auth, authRole } from '../middlewares/auth.js'
import { validateCreateUser, validateUpdateUser } from '../middlewares/validators.js'

const UsersRouter = express.Router()

// Rutas de los usuarios
UsersRouter.post('/register', validateCreateUser, createUser)
UsersRouter.post('/login', logInUser)
UsersRouter.post('/logout', auth, logOutUser)
UsersRouter.post('/logout-all', auth, logOutAllUser)
UsersRouter.put('/me', auth, validateUpdateUser, updateSelfUser)
UsersRouter.put('/:id', auth, authRole(['Administrador']), validateUpdateUser, updateUser)

UsersRouter.put('/:id/disable', auth, authRole(['Administrador']), disableUser);
UsersRouter.put('/:id/enable', auth, authRole(['Administrador']), enableUser);

UsersRouter.get('/me', auth, getUser)
UsersRouter.get('/getuser/:id', auth, authRole(['Administrador']), getUserById)
UsersRouter.get('/', auth, authRole(['Administrador']), getAllUsers)

export default UsersRouter