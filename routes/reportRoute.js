import express from 'express'
import { exportReportCSV, exportReportPDF, exportReportInvestigatorsCSV, exportReportInvestigatorsPDF } from '../controllers/reportController.js'
import { auth } from '../middlewares/auth.js'
import { authRole } from '../middlewares/auth.js'

const ReportRouter = express.Router();

// Exportamos informes de proyectos
ReportRouter.get('/projects/csv', auth, authRole(['Administrador']), exportReportCSV)
ReportRouter.get('/projects/pdf', auth, authRole(['Administrador']), exportReportPDF)

// Exportamos informes de investigadores y evaluaciones
ReportRouter.get('/investigators/csv', auth, authRole(['Administrador']), exportReportInvestigatorsCSV)
ReportRouter.get('/investigators/pdf', auth, authRole(['Administrador']), exportReportInvestigatorsPDF)

export default ReportRouter