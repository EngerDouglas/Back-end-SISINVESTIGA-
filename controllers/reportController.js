import * as ReportService from '../services/reportService.js';
import { BadRequestError } from '../utils/errors.js';
import fs from 'fs';
import path from 'path';

export const exportReportCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateProjectsCSV();
    res.header('Content-Type', 'text/csv');
    res.attachment(ReportService.generateUniqueFilename('Project_Reports', 'csv'));
    res.status(200).send(csv);
  } catch (error) {
    next(new BadRequestError('Error al generar el informe CSV de proyectos', error));
  }
};

export const exportReportPDF = async (req, res, next) => {
  try {
    const exportDir = ReportService.ensureExportDirExists();
    const doc = await ReportService.generateProjectsPDF();
    const filename = ReportService.generateUniqueFilename('Report_Projects', 'pdf');
    const filePath = path.join(exportDir, filename);
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    doc.end();

    writeStream.on('finish', () => {
      res.status(200).download(filePath, (err) => {
        if (err) {
          next(new BadRequestError('Error al descargar el archivo PDF de proyectos', err));
        }
        // Eliminar el archivo después de la descarga
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar el archivo temporal:', unlinkErr);
        });
      });
    });

    writeStream.on('error', (err) => {
      next(new BadRequestError('Error al escribir el archivo PDF de proyectos', err));
    });
  } catch (error) {
    next(new BadRequestError('Error al generar el informe PDF de proyectos', error));
  }
};

export const exportReportInvestigatorsCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateEvaluationsCSV();
    res.header('Content-Type', 'text/csv');
    res.attachment(ReportService.generateUniqueFilename('Report_Investigators', 'csv'));
    res.status(200).send(csv);
  } catch (error) {
    next(new BadRequestError('Error al generar el informe CSV de evaluaciones', error));
  }
};

export const exportReportInvestigatorsPDF = async (req, res, next) => {
  try {
    const exportDir = ReportService.ensureExportDirExists();
    const doc = await ReportService.generateEvaluationsPDF();
    const filename = ReportService.generateUniqueFilename('Report_Investigators', 'pdf');
    const filePath = path.join(exportDir, filename);
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    doc.end();

    writeStream.on('finish', () => {
      res.status(200).download(filePath, (err) => {
        if (err) {
          next(new BadRequestError('Error al descargar el archivo PDF de evaluaciones', err));
        }
        // Eliminar el archivo después de la descarga
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar el archivo temporal:', unlinkErr);
        });
      });
    });

    writeStream.on('error', (err) => {
      next(new BadRequestError('Error al escribir el archivo PDF de evaluaciones', err));
    });
  } catch (error) {
    next(new BadRequestError('Error al generar el informe PDF de evaluaciones', error));
  }
};