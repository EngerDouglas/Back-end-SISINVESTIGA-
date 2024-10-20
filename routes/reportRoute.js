import express from 'express'
import { 
  exportReportCSV, 
  exportReportPDF, 
  exportReportInvestigatorsCSV, 
  exportReportInvestigatorsPDF,
  exportInvestigatorProjectsCSV,
  exportInvestigatorProjectsPDF,
  exportInvestigatorEvaluationsCSV,
  exportInvestigatorEvaluationsPDF
} from '../controllers/reportController.js'
import { auth, authRole } from '../middlewares/auth.js'

const ReportRouter = express.Router();

// Rutas para administradores
ReportRouter.get('/admin/projects/csv', auth, authRole(['Administrador']), exportReportCSV)
ReportRouter.get('/admin/projects/pdf', auth, authRole(['Administrador']), exportReportPDF)
ReportRouter.get('/admin/evaluations/csv', auth, authRole(['Administrador']), exportReportInvestigatorsCSV)
ReportRouter.get('/admin/evaluations/pdf', auth, authRole(['Administrador']), exportReportInvestigatorsPDF)

// Rutas para investigadores
ReportRouter.get('/investigator/projects/csv', auth, authRole(['Investigador']), exportInvestigatorProjectsCSV)
ReportRouter.get('/investigator/projects/pdf', auth, authRole(['Investigador']), exportInvestigatorProjectsPDF)
ReportRouter.get('/investigator/evaluations/csv', auth, authRole(['Investigador']), exportInvestigatorEvaluationsCSV)
ReportRouter.get('/investigator/evaluations/pdf', auth, authRole(['Investigador']), exportInvestigatorEvaluationsPDF)

export default ReportRouter