import * as ReportService from '../services/reportService.js';
import { BadRequestError } from '../utils/errors.js';
import fs from 'fs';
import path from 'path';

export const exportReportCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateProjectsCSV(req.user);
    res.header('Content-Type', 'text/csv');
    res.attachment(ReportService.generateUniqueFilename('Project_Reports', 'csv'));
    res.status(200).send(csv);
  } catch (error) {
    next(new BadRequestError('Error al generar el informe CSV de proyectos', error));
  }
};

export const exportReportPDF = async (req, res, next) => {
  try {
    const doc = await ReportService.generateProjectsPDF(req.user);

    // Configurar los encabezados para la descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${ReportService.generateUniqueFilename('Project_Reports', 'pdf')}`);

    // Enviar el PDF al cliente
    doc.pipe(res);

    // Finalizar el documento
    doc.end();
  } catch (error) {
    next(new BadRequestError('Error al generar el informe PDF de proyectos', error));
  }
};

export const exportReportInvestigatorsCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateEvaluationsCSV(req.user);
    res.header('Content-Type', 'text/csv');
    res.attachment(ReportService.generateUniqueFilename('Evaluations_Report', 'csv'));
    res.status(200).send(csv);
  } catch (error) {
    next(new BadRequestError('Error al generar el informe CSV de evaluaciones', error));
  }
};

export const exportReportInvestigatorsPDF = async (req, res, next) => {
  try {
    const doc = await ReportService.generateEvaluationsPDF(req.user);

    // Configurar los encabezados para la descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${ReportService.generateUniqueFilename('Evaluations_Report', 'pdf')}`);

    // Enviar el PDF al cliente
    doc.pipe(res);

    // Finalizar el documento
    doc.end();
  } catch (error) {
    next(new BadRequestError('Error al generar el informe PDF de evaluaciones', error));
  }
};