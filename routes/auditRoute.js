import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { auth, authRole } from '../middlewares/auth.js';

const AuditRouter = express.Router();

AuditRouter.get('/', auth, authRole(['Administrador']), getAuditLogs);

export default AuditRouter;