import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import helmet from 'helmet'
import { corsMiddleware } from './middlewares/cors.js'
import RolesRouter from './routes/roleRoute.js'
import UsersRouter from './routes/userRoute.js'
import ProjectRouter from './routes/projectRoute.js'
import PublicationsRouter from './routes/publicationRoute.js'
import EvaluationRouter from './routes/evaluationRoute.js'
import RequestRouter from './routes/requestRoute.js'
import ReportRouter from './routes/reportRoute.js'
import errorHandler from './middlewares/errorHandler.js'
import logger from './utils/logger.js'
import { connectDB } from './config/db.js'

dotenv.config()

// Crear la app
const app = express()
const port = process.env.PORT || 3005

// Habilitamos Lectura y Cookie Parser mas Middlewares
app.use( corsMiddleware())
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended:true }))
app.use(express.json())
app.use(express.urlencoded({ extended:true }))
app.use(cookieParser())
app.use(helmet())

app.use('/api/roles', RolesRouter)
app.use('/api/users', UsersRouter)
app.use('/api/projects', ProjectRouter)
app.use('/api/publications', PublicationsRouter)
app.use('/api/evaluations', EvaluationRouter)
app.use('/api/requests', RequestRouter)
app.use('/api/reports', ReportRouter)

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SISINVESTIGA'
  })
})

app.use(errorHandler)

// Definicion de mi puerto y arranque del proyecto
connectDB().then(() => {
  app.listen(port, () => {
    logger.info(`The server is running on http://localhost:${port}`)
  });
}).catch(err => {
  logger.error('Failet to connect to the database', err)
  process.exit(1)
})

export default app