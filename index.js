import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import helmet from 'helmet'
import { corsMiddleware } from './middlewares/cors.js'
import RolesRouter from './routes/roleRoute.js'
import UsersRouter from './routes/userRoute.js'
import ProyectosRouter from './routes/proyectosRouter.js'
import PublicationsRouter from './routes/publicationRoute.js'
import './config/db.js'

dotenv.config()

// Crear la app
const app = express()
const port = process.env.PORT

// Habilitar Lectura y Cookie Parser mas Middlewares
app.use( corsMiddleware())
// app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended:true }))
app.use(bodyParser.json())
app.use(helmet())

app.use('/api/roles', RolesRouter)
app.use('/api/users', UsersRouter)
app.use('/api/projects', ProyectosRouter)
app.use('/api/publications', PublicationsRouter)


app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SISINVESTIGA'
  })
})

// Definicion de mi puerto y arranque del proyecto
app.listen(port, () => {
  console.log(`The server is running on http://localhost:${port}`)
})