import Project from '../models/Project.js';
import Evaluation from '../models/Evaluation.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getLogoPath = () => path.join(__dirname, '../templates/assets/img/LogoWebUCSD.png');

export const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString('es-ES') : 'N/A';
};

export const ensureExportDirExists = () => {
  const exportDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  return exportDir;
};

export const generateUniqueFilename = (prefix, extension) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
};

// Administrator functions

export const getDetailedProjects = async () => {
  const projects = await Project.find({ isDeleted: false })
    .populate({
      path: 'investigadores',
      select: 'nombre apellido email especializacion',
      populate: { path: 'role', select: 'roleName' }
    })
    .populate({
      path: 'evaluaciones',
      populate: { path: 'evaluator', select: 'nombre apellido' }
    })
    .lean();

  return projects;
};

export const getDetailedEvaluations = async () => {
  const evaluations = await Evaluation.find({ isDeleted: false })
    .populate({
      path: 'evaluator',
      select: 'nombre apellido email especializacion',
      populate: { path: 'role', select: 'roleName' }
    })
    .populate({
      path: 'project',
      select: 'nombre descripcion estado'
    })
    .lean();

  return evaluations;
};

export const generateProjectsCSV = async () => {
  const projects = await getDetailedProjects();

  const flattenedProjects = projects.map(project => ({
    nombre: project.nombre,
    descripcion: project.descripcion,
    estado: project.estado,
    fechaInicio: formatDate(project.cronograma?.fechaInicio),
    fechaFin: formatDate(project.cronograma?.fechaFin),
    presupuesto: project.presupuesto,
    investigadores: project.investigadores.map(inv => `${inv.nombre} ${inv.apellido}`).join(', '),
    evaluacionPromedio: project.evaluaciones.length > 0 
      ? (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2)
      : 'N/A'
  }));

  const fields = ['nombre', 'descripcion', 'estado', 'fechaInicio', 'fechaFin', 'presupuesto', 'investigadores', 'evaluacionPromedio'];
  const parser = new Parser({ fields });
  return parser.parse(flattenedProjects);
};

export const generateProjectsPDF = async () => {
  const projects = await getDetailedProjects();
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = generateUniqueFilename('Project_Reports', 'pdf');
  const filePath = path.join(await ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado con logo y título
    doc.image(getLogoPath(), { fit: [50, 50], align: 'left' });
    doc.fontSize(20).text('Informe de Proyectos', { align: 'center' });
    doc.moveDown();

    projects.forEach(project => {
      doc.fontSize(16).text(project.nombre, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Descripción: ${project.descripcion || 'N/A'}`);
      doc.text(`Estado: ${project.estado || 'N/A'}`);
      doc.text(`Fecha de inicio: ${formatDate(project.cronograma?.fechaInicio)}`);
      doc.text(`Fecha de finalización: ${formatDate(project.cronograma?.fechaFin)}`);
      doc.text(`Presupuesto: $${project.presupuesto || 'N/A'}`);
      doc.moveDown(0.5);

      // Investigadores
      doc.fontSize(14).text('Investigadores:', { underline: true });
      doc.fontSize(12);
      if (project.investigadores && project.investigadores.length > 0) {
        project.investigadores.forEach(inv => {
          doc.text(`- ${inv.nombre} ${inv.apellido} (${inv.especializacion})`);
        });
      } else {
        doc.text('No hay investigadores asignados.');
      }
      doc.moveDown(0.5);

      // Recursos
      doc.fontSize(14).text('Recursos:', { underline: true });
      doc.fontSize(12);
      doc.text(project.recursos?.join(', ') || 'N/A');
      doc.moveDown(0.5);

      // Hitos
      doc.fontSize(14).text('Hitos:', { underline: true });
      doc.fontSize(12);
      if (project.hitos && project.hitos.length > 0) {
        project.hitos.forEach(hito => {
          doc.text(`- ${hito.nombre}: ${formatDate(hito.fecha)}`);
        });
      } else {
        doc.text('No hay hitos definidos.');
      }
      doc.moveDown(0.5);

      // Evaluación Promedio
      if (project.evaluaciones && project.evaluaciones.length > 0) {
        const avgEvaluation = (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2);
        doc.fontSize(14).text(`Evaluación promedio: ${avgEvaluation}`, { align: 'right' });
      } else {
        doc.fontSize(14).text('No hay evaluaciones disponibles.', { align: 'right' });
      }

      doc.addPage();
    });

    doc.end();

    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};

export const generateEvaluationsCSV = async () => {
  const evaluations = await getDetailedEvaluations();

  const flattenedEvaluations = evaluations.map(evaluation => ({
    evaluadorNombre: evaluation.evaluator.nombre,
    evaluadorApellido: evaluation.evaluator.apellido,
    evaluadorEmail: evaluation.evaluator.email,
    evaluadorEspecializacion: evaluation.evaluator.especializacion,
    evaluadorRol: evaluation.evaluator.role.roleName,
    proyectoNombre: evaluation.project.nombre,
    proyectoDescripcion: evaluation.project.descripcion,
    proyectoEstado: evaluation.project.estado,
    puntuacion: evaluation.puntuacion,
    comentarios: evaluation.comentarios,
    fechaEvaluacion: formatDate(evaluation.fechaEvaluacion)
  }));

  const fields = [
    'evaluadorNombre',
    'evaluadorApellido',
    'evaluadorEmail',
    'evaluadorEspecializacion',
    'evaluadorRol',
    'proyectoNombre',
    'proyectoDescripcion',
    'proyectoEstado',
    'puntuacion',
    'comentarios',
    'fechaEvaluacion'
  ];
  const parser = new Parser({ fields });
  return parser.parse(flattenedEvaluations);
};

export const generateEvaluationsPDF = async () => {
  const evaluations = await getDetailedEvaluations();
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = generateUniqueFilename('Evaluations_Report', 'pdf');
  const filePath = path.join(ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado con logo y título
    doc.image(getLogoPath(), { fit: [50, 50], align: 'left' });
    doc.fontSize(20).text('Informe de Evaluaciones', { align: 'center' });
    doc.moveDown();

    evaluations.forEach((evaluation, index) => {
      doc.fontSize(16).text(`Proyecto: ${evaluation.project?.nombre || 'Proyecto desconocido'}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Evaluador: ${evaluation.evaluator?.nombre || 'N/A'} ${evaluation.evaluator?.apellido || ''}`);
      doc.text(`Email: ${evaluation.evaluator?.email || 'N/A'}`);
      doc.text(`Especialización: ${evaluation.evaluator?.especializacion || 'N/A'}`);
      doc.text(`Rol: ${evaluation.evaluator?.role?.roleName || 'N/A'}`);
      doc.moveDown(0.5);
      doc.text(`Puntuación: ${evaluation.puntuacion || 'N/A'}`);
      doc.text(`Comentarios: ${evaluation.comentarios || 'N/A'}`);
      doc.text(`Fecha de evaluación: ${formatDate(evaluation.fechaEvaluacion)}`);
      doc.moveDown();

      // Añadir una nueva página si no es la última evaluación
      if (index < evaluations.length - 1) {
        doc.addPage();
      }
    });

    doc.end();

    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};

// Investigator functions

export const getDetailedProjectsForInvestigator = async (userId) => {
  const projects = await Project.find({ 
    investigadores: userId,
    isDeleted: false 
  })
    .populate({
      path: 'investigadores',
      select: 'nombre apellido email especializacion',
      populate: { path: 'role', select: 'roleName' }
    })
    .populate({
      path: 'evaluaciones',
      populate: { path: 'evaluator', select: 'nombre apellido' }
    })
    .lean();

  return projects;
};

export const getDetailedEvaluationsForInvestigator = async (userId) => {
  const projects = await Project.find({ investigadores: userId }).select('_id');
  const projectIds = projects.map(project => project._id);

  const evaluations = await Evaluation.find({
    project: { $in: projectIds },
    isDeleted: false
  })
    .populate({
      path: 'evaluator',
      select: 'nombre apellido email especializacion',
      populate: { path: 'role', select: 'roleName' }
    })
    .populate({
      path: 'project',
      select: 'nombre descripcion estado'
    })
    .lean();

  return evaluations;
};

export const generateProjectsCSVForInvestigator = async (userId) => {
  const projects = await getDetailedProjectsForInvestigator(userId);

  const flattenedProjects = projects.map(project => ({
    nombre: project.nombre,
    descripcion: project.descripcion,
    estado: project.estado,
    fechaInicio: formatDate(project.cronograma?.fechaInicio),
    fechaFin: formatDate(project.cronograma?.fechaFin),
    presupuesto: project.presupuesto,
    evaluacionPromedio: project.evaluaciones.length > 0 
      ? (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2)
      : 'N/A'
  }));

  const fields = ['nombre', 'descripcion', 'estado', 'fechaInicio', 'fechaFin', 'presupuesto', 'evaluacionPromedio'];
  const parser = new Parser({ fields });
  return parser.parse(flattenedProjects);
};

export const generateProjectsPDFForInvestigator = async (userId) => {
  const projects = await getDetailedProjectsForInvestigator(userId);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = generateUniqueFilename('Investigator_Project_Reports', 'pdf');
  const filePath = path.join(await ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado con logo y título
    doc.image(getLogoPath(), { fit: [50, 50], align: 'left' });
    doc.fontSize(20).text('Informe de Mis Proyectos', { align: 'center' });
    doc.moveDown();

    projects.forEach(project => {
      doc.fontSize(16).text(project.nombre, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Descripción: ${project.descripcion || 'N/A'}`);
      doc.text(`Estado: ${project.estado || 'N/A'}`);
      doc.text(`Fecha de inicio: ${formatDate(project.cronograma?.fechaInicio)}`);
      doc.text(`Fecha de finalización: ${formatDate(project.cronograma?.fechaFin)}`);
      doc.text(`Presupuesto: $${project.presupuesto || 'N/A'}`);
      doc.moveDown(0.5);

      // Recursos
      doc.fontSize(14).text('Recursos:', { underline: true });
      doc.fontSize(12);
      doc.text(project.recursos?.join(', ') || 'N/A');
      doc.moveDown(0.5);

      // Hitos
      doc.fontSize(14).text('Hitos:', { underline: true });
      doc.fontSize(12);
      if (project.hitos && project.hitos.length > 0) {
        project.hitos.forEach(hito => {
          doc.text(`- ${hito.nombre}: ${formatDate(hito.fecha)}`);
        });
      } else {
        doc.text('No hay hitos definidos.');
      }
      doc.moveDown(0.5);

      // Evaluación Promedio
      if (project.evaluaciones && project.evaluaciones.length > 0) {
        const avgEvaluation = (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / 
project.evaluaciones.length).toFixed(2);
        doc.fontSize(14).text(`Evaluación promedio: ${avgEvaluation}`, { align: 'right' });
      } else {
        doc.fontSize(14).text('No hay evaluaciones disponibles.', { align: 'right' });
      }

      doc.addPage();
    });

    doc.end();

    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};

export const generateEvaluationsCSVForInvestigator = async (userId) => {
  const evaluations = await getDetailedEvaluationsForInvestigator(userId);

  const flattenedEvaluations = evaluations.map(evaluation => ({
    proyectoNombre: evaluation.project.nombre,
    proyectoDescripcion: evaluation.project.descripcion,
    proyectoEstado: evaluation.project.estado,
    puntuacion: evaluation.puntuacion,
    comentarios: evaluation.comentarios,
    fechaEvaluacion: formatDate(evaluation.fechaEvaluacion)
  }));

  const fields = [
    'proyectoNombre',
    'proyectoDescripcion',
    'proyectoEstado',
    'puntuacion',
    'comentarios',
    'fechaEvaluacion'
  ];
  const parser = new Parser({ fields });
  return parser.parse(flattenedEvaluations);
};

export const generateEvaluationsPDFForInvestigator = async (userId) => {
  const evaluations = await getDetailedEvaluationsForInvestigator(userId);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const filename = generateUniqueFilename('Investigator_Evaluations_Report', 'pdf');
  const filePath = path.join(ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado con logo y título
    doc.image(getLogoPath(), { fit: [50, 50], align: 'left' });
    doc.fontSize(20).text('Informe de Evaluaciones de Mis Proyectos', { align: 'center' });
    doc.moveDown();

    evaluations.forEach((evaluation, index) => {
      doc.fontSize(16).text(`Proyecto: ${evaluation.project?.nombre || 'Proyecto desconocido'}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Puntuación: ${evaluation.puntuacion || 'N/A'}`);
      doc.text(`Comentarios: ${evaluation.comentarios || 'N/A'}`);
      doc.text(`Fecha de evaluación: ${formatDate(evaluation.fechaEvaluacion)}`);
      doc.moveDown();

      // Añadir una nueva página si no es la última evaluación
      if (index < evaluations.length - 1) {
        doc.addPage();
      }
    });

    doc.end();

    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};