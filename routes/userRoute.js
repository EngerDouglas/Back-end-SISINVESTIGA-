import express from 'express'
import { createUser, logInUser, logOutUser, logOutAllUser, updateUser, updateSelfUser, getUser, getAllUsers, getUserById } from '../controllers/userController.js'
import { auth } from '../middlewares/auth.js'
import { authRole } from '../middlewares/auth.js'

const UsersRouter = express.Router()

// Rutas de los usuarios
UsersRouter.post('/register', createUser)
UsersRouter.post('/login', logInUser)
UsersRouter.post('/logout', auth, logOutUser)
UsersRouter.post('/logout-all', auth, logOutAllUser)
UsersRouter.put('/me', auth, updateSelfUser)
UsersRouter.put('/:id', auth, authRole(['Administrador']), updateUser)

UsersRouter.get('/me', auth, getUser)
UsersRouter.get('/getuser/:id', auth, authRole(['Administrador']), getUserById)
UsersRouter.get('/', auth, authRole(['Administrador']), getAllUsers)

export default UsersRouter