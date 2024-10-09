import Project from '../models/Project.js';
import Evaluation from '../models/Evaluation.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'N/A';
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

  if (!projects || projects.length === 0) {
    throw new BadRequestError('No se encontraron proyectos para generar el informe');
  }

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

  if (!evaluations || evaluations.length === 0) {
    throw new BadRequestError('No se encontraron evaluaciones para generar el informe');
  }

  return evaluations;
};

export const generateProjectsCSV = async () => {
  const projects = await getDetailedProjects();

  const flattenedProjects = projects.map(project => ({
    nombre: project.nombre,
    descripcion: project.descripcion,
    objetivos: project.objetivos,
    presupuesto: project.presupuesto,
    estado: project.estado,
    fechaInicio: formatDate(project.cronograma.fechaInicio),
    fechaFin: formatDate(project.cronograma.fechaFin),
    investigadores: project.investigadores.map(inv => `${inv.nombre} ${inv.apellido} (${inv.especializacion})`).join(', '),
    recursos: project.recursos.join(', '),
    hitos: project.hitos.map(hito => `${hito.nombre}: ${formatDate(hito.fecha)}`).join('; '),
    evaluacionPromedio: project.evaluaciones.length > 0 
      ? (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2)
      : 'N/A'
  }));

  const fields = ['nombre', 'descripcion', 'objetivos', 'presupuesto', 'estado', 'fechaInicio', 'fechaFin', 'investigadores', 'recursos', 'hitos', 'evaluacionPromedio'];
  const parser = new Parser({ fields });
  return parser.parse(flattenedProjects);
};

export const generateProjectsPDF = async () => {
  const projects = await getDetailedProjects();
  const doc = new PDFDocument();

  doc.fontSize(18).text('Informe Detallado de Proyectos', { align: 'center' });
  projects.forEach(project => {
    doc.moveDown().fontSize(14).text(project.nombre, { underline: true });
    doc.fontSize(10).text(`Descripción: ${project.descripcion || 'N/A'}`);
    doc.text(`Objetivos: ${project.objetivos || 'N/A'}`);
    doc.text(`Presupuesto: $${project.presupuesto || 'N/A'}`);
    doc.text(`Estado: ${project.estado || 'N/A'}`);
    doc.text(`Fecha de inicio: ${formatDate(project.cronograma?.fechaInicio)}`);
    doc.text(`Fecha de finalización: ${formatDate(project.cronograma?.fechaFin)}`);
    doc.text('Investigadores:');
    if (project.investigadores && project.investigadores.length > 0) {
      project.investigadores.forEach(inv => {
        doc.text(`  - ${inv.nombre} ${inv.apellido} (${inv.especializacion}) - ${inv.role?.roleName || 'N/A'}`);
      });
    } else {
      doc.text('  No hay investigadores asignados');
    }
    doc.text(`Recursos: ${project.recursos?.join(', ') || 'N/A'}`);
    doc.text('Hitos:');
    if (project.hitos && project.hitos.length > 0) {
      project.hitos.forEach(hito => {
        doc.text(`  - ${hito.nombre}: ${formatDate(hito.fecha)}`);
      });
    } else {
      doc.text('  No hay hitos definidos');
    }
    if (project.evaluaciones && project.evaluaciones.length > 0) {
      const avgEvaluation = (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2);
      doc.text(`Evaluación promedio: ${avgEvaluation}`);
    } else {
      doc.text('No hay evaluaciones disponibles');
    }
    doc.moveDown();
  });

  return doc;
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

  const fields = ['evaluadorNombre', 'evaluadorApellido', 'evaluadorEmail', 'evaluadorEspecializacion', 'evaluadorRol', 'proyectoNombre', 'proyectoDescripcion', 'proyectoEstado', 'puntuacion', 'comentarios', 'fechaEvaluacion'];
  const parser = new Parser({ fields });
  return parser.parse(flattenedEvaluations);
};

export const generateEvaluationsPDF = async () => {
  const evaluations = await getDetailedEvaluations();
  const doc = new PDFDocument();

  doc.fontSize(18).text('Informe Detallado de Evaluaciones', { align: 'center' });
  evaluations.forEach(evaluation => {
    doc.moveDown().fontSize(14).text(`Evaluación para ${evaluation.project?.nombre || 'Proyecto desconocido'}`, { underline: true });
    doc.fontSize(10).text(`Evaluador: ${evaluation.evaluator?.nombre || 'N/A'} ${evaluation.evaluator?.apellido || ''}`);
    doc.text(`Email: ${evaluation.evaluator?.email || 'N/A'}`);
    doc.text(`Especialización: ${evaluation.evaluator?.especializacion || 'N/A'}`);
    doc.text(`Rol: ${evaluation.evaluator?.role?.roleName || 'N/A'}`);
    doc.text(`Proyecto: ${evaluation.project?.nombre || 'N/A'}`);
    doc.text(`Descripción del proyecto: ${evaluation.project?.descripcion || 'N/A'}`);
    doc.text(`Estado del proyecto: ${evaluation.project?.estado || 'N/A'}`);
    doc.text(`Puntuación: ${evaluation.puntuacion || 'N/A'}`);
    doc.text(`Comentarios: ${evaluation.comentarios || 'N/A'}`);
    doc.text(`Fecha de evaluación: ${formatDate(evaluation.fechaEvaluacion)}`);
    doc.moveDown();
  });

  return doc;
};