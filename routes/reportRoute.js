import express from 'express'
import { exportReportCSV, exportReportPDF, exportReportInvestigatorsCSV, exportReportInvestigatorsPDF } from '../controllers/reportController.js'
import { auth, authRole } from '../middlewares/auth.js'

const ReportRouter = express.Router();

// Exportamos informes de proyectos
ReportRouter.get('/projects/csv', auth, exportReportCSV)
ReportRouter.get('/projects/pdf', auth, exportReportPDF)

// Exportamos informes de investigadores y evaluaciones
ReportRouter.get('/investigators/csv', auth, exportReportInvestigatorsCSV)
ReportRouter.get('/investigators/pdf', auth, exportReportInvestigatorsPDF)

export default ReportRouter