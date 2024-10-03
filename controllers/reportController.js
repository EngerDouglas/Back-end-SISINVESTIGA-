import { fileURLToPath } from 'url'; 
import path from 'path';
import fs from 'fs';
import Project from '../models/Project.js';
import Evaluation from '../models/Evaluation.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureExportDirExists = () => {
  const exportDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
};

const generateUniqueFilename = (prefix, extension) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
};

// Función auxiliar para formatear fechas
const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'N/A';
};

// Función auxiliar para obtener proyectos con información detallada
const getDetailedProjects = async () => {
  return await Project.find({ isDeleted: false })
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
};

export const exportReportCSV = async (req, res) => {
  try {
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
    const csv = parser.parse(flattenedProjects);

    res.header('Content-Type', 'text/csv');
    res.attachment(generateUniqueFilename('Project_Reports', 'csv'));
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error al generar el informe CSV', error: error.message });
  }
};

export const exportReportPDF = async (req, res) => {
  try {
    ensureExportDirExists();

    const projects = await getDetailedProjects();

    const doc = new PDFDocument();
    const filename = generateUniqueFilename('Report_Projects', 'pdf');
    const filePath = path.join(__dirname, '../exports', filename);
    const writeStream = fs.createWriteStream(filePath);
    
    doc.pipe(writeStream);

    doc.fontSize(18).text('Informe Detallado de Proyectos', { align: 'center' });
    projects.forEach(project => {
      doc.moveDown().fontSize(14).text(project.nombre, { underline: true });
      doc.fontSize(10).text(`Descripción: ${project.descripcion}`);
      doc.text(`Objetivos: ${project.objetivos}`);
      doc.text(`Presupuesto: $${project.presupuesto}`);
      doc.text(`Estado: ${project.estado}`);
      doc.text(`Fecha de inicio: ${formatDate(project.cronograma.fechaInicio)}`);
      doc.text(`Fecha de finalización: ${formatDate(project.cronograma.fechaFin)}`);
      doc.text('Investigadores:');
      project.investigadores.forEach(inv => {
        doc.text(`  - ${inv.nombre} ${inv.apellido} (${inv.especializacion}) - ${inv.role.roleName}`);
      });
      doc.text(`Recursos: ${project.recursos.join(', ')}`);
      doc.text('Hitos:');
      project.hitos.forEach(hito => {
        doc.text(`  - ${hito.nombre}: ${formatDate(hito.fecha)}`);
      });
      if (project.evaluaciones.length > 0) {
        const avgEvaluation = (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2);
        doc.text(`Evaluación promedio: ${avgEvaluation}`);
      }
      doc.moveDown();
    });

    doc.end();

    writeStream.on('finish', () => {
      res.status(200).download(filePath);
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al generar el informe PDF', error: error.message });
  }
};

export const exportReportInvestigatorsCSV = async (req, res) => {
  try {
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
    const csv = parser.parse(flattenedEvaluations);

    res.header('Content-Type', 'text/csv');
    res.attachment(generateUniqueFilename('Report_Investigators', 'csv'));
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error al generar el informe CSV de evaluaciones', error: error.message });
  }
};

export const exportReportInvestigatorsPDF = async (req, res) => {
  try {
    ensureExportDirExists();

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

    const doc = new PDFDocument();
    const filename = generateUniqueFilename('Report_Investigators', 'pdf');
    const filePath = path.join(__dirname, '../exports', filename);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(18).text('Informe Detallado de Evaluaciones', { align: 'center' });
    evaluations.forEach(evaluation => {
      doc.moveDown().fontSize(14).text(`Evaluación para ${evaluation.project.nombre}`, { underline: true });
      doc.fontSize(10).text(`Evaluador: ${evaluation.evaluator.nombre} ${evaluation.evaluator.apellido}`);
      doc.text(`Email: ${evaluation.evaluator.email}`);
      doc.text(`Especialización: ${evaluation.evaluator.especializacion}`);
      doc.text(`Rol: ${evaluation.evaluator.role.roleName}`);
      doc.text(`Proyecto: ${evaluation.project.nombre}`);
      doc.text(`Descripción del proyecto: ${evaluation.project.descripcion}`);
      doc.text(`Estado del proyecto: ${evaluation.project.estado}`);
      doc.text(`Puntuación: ${evaluation.puntuacion}`);
      doc.text(`Comentarios: ${evaluation.comentarios}`);
      doc.text(`Fecha de evaluación: ${formatDate(evaluation.fechaEvaluacion)}`);
      doc.moveDown();
    });

    doc.end();

    writeStream.on('finish', () => {
      res.status(200).download(filePath);
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al generar el informe PDF', error: error.message });
  }
};