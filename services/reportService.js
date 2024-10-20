import Project from '../models/Project.js';
import Evaluation from '../models/Evaluation.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFontPath = (fontName) => path.join(__dirname, `../templates/assets/fonts/${fontName}`);
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

// Modern color palette
const colors = {
  primary: '#3498db',
  secondary: '#2c3e50',
  accent: '#e74c3c',
  text: '#34495e',
  background: '#ecf0f1',
  lightGray: '#bdc3c7'
};

// Modern color palette for admin reports
const adminColors = {
  primary: '#1a237e',
  secondary: '#0d47a1',
  accent: '#00bcd4',
  text: '#263238',
  background: '#ffffff',
  lightGray: '#e0e0e0',
  white: '#ffffff'
};

  // **************************** Estilos para PDF a los Investigadroes ************************************************* //
  const setupDocument = (doc) => {
    doc.registerFont('Roboto-Regular', getFontPath('Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', getFontPath('Roboto-Bold.ttf'));
    doc.registerFont('Roboto-Italic', getFontPath('Roboto-Italic.ttf'));
  
    doc.font('Roboto-Regular').fontSize(10).fillColor(colors.text);
  
    // Add a subtle background color
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.background);
  
    const addPageNumbers = () => {
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(colors.secondary)
          .text(
            `Página ${i + 1} de ${pageCount}`,
            0,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width }
          );
      }
    };
  
    doc.on('end', addPageNumbers);
  };
  
  const addHeader = (doc, title) => {
    doc.image(getLogoPath(), 50, 45, { width: 50 })
      .fontSize(24)
      .font('Roboto-Bold')
      .fillColor(colors.primary)
      .text(title, 110, 50, { align: 'center' })
      .moveDown(2);
  
    // Add a decorative line
    doc.moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke(colors.primary);
  
    doc.moveDown();
  };
  
  const addSection = (doc, title, content) => {
    doc.fontSize(16)
      .font('Roboto-Bold')
      .fillColor(colors.secondary)
      .text(title)
      .moveDown(0.5);
    
    doc.font('Roboto-Regular')
      .fontSize(10)
      .fillColor(colors.text);
    
    content.forEach(item => {
      doc.text(item);
    });
    
    doc.moveDown();
  };
  
  const addTable = (doc, headers, rows) => {
    const tableTop = doc.y;
    const tableLeft = 50;
    const cellPadding = 5;
    const columnWidth = (doc.page.width - 100) / headers.length;
  
    // Table header
    doc.font('Roboto-Bold').fontSize(10).fillColor(colors.primary);
    headers.forEach((header, i) => {
      doc.text(header, tableLeft + (i * columnWidth), tableTop, {
        width: columnWidth,
        align: 'center'
      });
    });
  
    // Table rows
    doc.font('Roboto-Regular').fontSize(10).fillColor(colors.text);
    let rowTop = tableTop + 20;
    rows.forEach((row, rowIndex) => {
      // Alternate row background for better readability
      if (rowIndex % 2 === 0) {
        doc.rect(tableLeft, rowTop, doc.page.width - 100, 20)
      }
  
      row.forEach((cell, columnIndex) => {
        doc.text(cell, tableLeft + (columnIndex * columnWidth), rowTop + cellPadding, {
          width: columnWidth,
          align: 'center'
        });
      });
      rowTop += 20;  
    });
  
    // Table border
    doc.rect(tableLeft, tableTop, doc.page.width - 100, rowTop - tableTop).stroke(colors.primary);
    doc.moveDown(2);
  };
// **************************** END ************************************************ //

  // **************************** Estilos para PDF a los Administradores ************************************************* //

  const setupAdminDocument = (doc) => {
    doc.registerFont('Montserrat-Regular', getFontPath('Montserrat-Regular.ttf'));
    doc.registerFont('Montserrat-Bold', getFontPath('Montserrat-Bold.ttf'));
    doc.registerFont('Montserrat-Italic', getFontPath('Montserrat-Italic.otf'));
  
    doc.font('Montserrat-Regular').fontSize(10).fillColor(adminColors.text);
  
    doc.fillColor(adminColors.background).rect(0, 0, doc.page.width, doc.page.height).fill();
  
    const addPageNumbers = () => {
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(adminColors.secondary)
          .text(
            `Página ${i + 1} de ${pageCount}`,
            0,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width }
          );
      }
    };
  
    doc.on('end', addPageNumbers);
  };
  
  const addAdminHeader = (doc, title) => {
    doc.rect(0, 0, doc.page.width, 100)
      .fill(adminColors.primary);
  
    doc.image(getLogoPath(), 50, 25, { width: 50 })
      .fontSize(28)
      .font('Montserrat-Bold')
      .fillColor(adminColors.white)
      .text(title, 110, 35, { align: 'center' })
      .moveDown(2);
  
    doc.moveTo(50, 90)
      .lineTo(doc.page.width - 50, 90)
      .lineWidth(3)
      .stroke(adminColors.accent);
  
    doc.moveDown();
  };
  
  const addAdminSection = (doc, title, content) => {
    doc.fontSize(16)
      .font('Montserrat-Bold')
      .fillColor(adminColors.secondary)
      .text(title)
      .moveDown(0.5);
    
    doc.font('Montserrat-Regular')
      .fontSize(10)
      .fillColor(adminColors.text);
    
    content.forEach(item => {
      doc.text(item);
    });
    
    doc.moveDown();
  };
  
  const addAdminTable = (doc, headers, rows) => {
    const tableTop = doc.y;
    const tableLeft = 50;
    const cellPadding = 5;
    const columnWidth = (doc.page.width - 100) / headers.length;
  
    doc.rect(tableLeft, tableTop, doc.page.width - 100, 30)
      .fill(adminColors.secondary);
    
    doc.font('Montserrat-Bold').fontSize(10).fillColor(adminColors.white);
    headers.forEach((header, i) => {
      doc.text(header, tableLeft + (i * columnWidth), tableTop + cellPadding, {
        width: columnWidth,
        align: 'center'
      });
    });
  
    doc.font('Montserrat-Regular').fontSize(10).fillColor(adminColors.text);
    let rowTop = tableTop + 30;
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.rect(tableLeft, rowTop, doc.page.width - 100, 25)
      }
  
      row.forEach((cell, columnIndex) => {
        doc.text(cell, tableLeft + (columnIndex * columnWidth), rowTop + cellPadding, {
          width: columnWidth,
          align: 'center'
        });
      });
      rowTop += 25;  
    });
  
    doc.rect(tableLeft, tableTop, doc.page.width - 100, rowTop - tableTop).stroke(adminColors.secondary);
    doc.moveDown(2);
  };
  
  const addScoreBar = (doc, score) => {
    const scoreWidth = 200;
    const scoreHeight = 20;
    const scoreX = (doc.page.width - scoreWidth) / 2;
    const scoreY = doc.y;
    
    doc.rect(scoreX, scoreY, scoreWidth, scoreHeight)
    
    const filledWidth = (score / 5) * scoreWidth;
    doc.rect(scoreX, scoreY, filledWidth, scoreHeight)
    
    doc.fontSize(12)
      .text(`${score} / 5`, scoreX, scoreY + scoreHeight + 5, { width: scoreWidth, align: 'center' });
  
    doc.moveDown();
  };

  // **************************** END ************************************************ //


// **************************** Administrator functions ************************************************ //

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
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = generateUniqueFilename('Admin_Project_Reports', 'pdf');
  const filePath = path.join(await ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    setupAdminDocument(doc);

    projects.forEach((project, index) => {
      addAdminHeader(doc, 'Informe de Proyectos');
      addAdminSection(doc, project.nombre, [
        `Descripción: ${project.descripcion || 'N/A'}`,
        `Estado: ${project.estado || 'N/A'}`,
        `Fecha de inicio: ${formatDate(project.cronograma?.fechaInicio)}`,
        `Fecha de finalización: ${formatDate(project.cronograma?.fechaFin)}`,
        `Presupuesto: $${project.presupuesto || 'N/A'}`,
      ]);

      addAdminSection(doc, 'Investigadores', [
        project.investigadores.map(inv => `${inv.nombre} ${inv.apellido} (${inv.especializacion})`).join(', ') || 'N/A'
      ]);

      if (project.evaluaciones && project.evaluaciones.length > 0) {
        const evaluacionesHeaders = ['Evaluador', 'Puntuación', 'Fecha'];
        const evaluacionesRows = project.evaluaciones.map(ev => [
          `${ev.evaluator.nombre} ${ev.evaluator.apellido}`,
          ev.puntuacion.toFixed(2),
          formatDate(ev.fechaEvaluacion)
        ]);
        addAdminTable(doc, evaluacionesHeaders, evaluacionesRows);

        const avgEvaluation = (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / project.evaluaciones.length).toFixed(2);
        doc.fontSize(14)
          .font('Montserrat-Bold')
          .fillColor(adminColors.accent)
          .text(`Evaluación promedio: ${avgEvaluation}`, { align: 'right' });
        
        addScoreBar(doc, parseFloat(avgEvaluation));
      } else {
        doc.text('No hay evaluaciones disponibles.');
      }

      if (index < projects.length - 1) {
        doc.addPage();
      }
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
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = generateUniqueFilename('Admin_Evaluations_Report', 'pdf');
  const filePath = path.join(await ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    setupAdminDocument(doc);

    evaluations.forEach((evaluation, index) => {
      addAdminHeader(doc, 'Informe de Evaluaciones');
      addAdminSection(doc, evaluation.project?.nombre || 'Proyecto desconocido', [
        `Evaluador: ${evaluation.evaluator?.nombre || 'N/A'} ${evaluation.evaluator?.apellido || ''}`,
        `Especialización: ${evaluation.evaluator?.especializacion || 'N/A'}`,
        `Rol: ${evaluation.evaluator?.role?.roleName || 'N/A'}`,
        `Puntuación: ${evaluation.puntuacion || 'N/A'}`,
        `Fecha de evaluación: ${formatDate(evaluation.fechaEvaluacion)}`
      ]);

      addScoreBar(doc, evaluation.puntuacion);

      addAdminSection(doc, 'Comentarios', [evaluation.comentarios || 'N/A']);

      if (index < evaluations.length - 1) {
        doc.addPage();
      }
    });

    doc.end();
    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};

// **************************** END ************************************************ //

// **************************** Investigator functions ************************************************ //

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
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = generateUniqueFilename('Investigator_Project_Reports', 'pdf');
  const filePath = path.join(await ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    setupDocument(doc);

    projects.forEach((project, index) => {
      addHeader(doc, 'Informe de Mis Proyectos');
      addSection(doc, project.nombre, [
        `Descripción: ${project.descripcion || 'N/A'}`,
        `Estado: ${project.estado || 'N/A'}`,
        `Fecha de inicio: ${formatDate(project.cronograma?.fechaInicio)}`,
        `Fecha de finalización: ${formatDate(project.cronograma?.fechaFin)}`,
        `Presupuesto: $${project.presupuesto || 'N/A'}`
      ]);

      addSection(doc, 'Recursos', [project.recursos?.join(', ') || 'N/A']);

      if (project.hitos && project.hitos.length > 0) {
        const hitosHeaders = ['Nombre', 'Fecha'];
        const hitosRows = project.hitos.map(hito => [hito.nombre, formatDate(hito.fecha)]);
        addTable(doc, hitosHeaders, hitosRows);
      } else {
        doc.text('No hay hitos definidos.');
      }

      if (project.evaluaciones && project.evaluaciones.length > 0) {
        const avgEvaluation = (project.evaluaciones.reduce((sum, ev) => sum + ev.puntuacion, 0) / 
        project.evaluaciones.length).toFixed(2);
        doc.fontSize(14)
          .font('Roboto-Bold')
          .fillColor(colors.accent)
          .text(`Evaluación promedio: ${avgEvaluation}`, { align: 'right' });
      } else {
        doc.fontSize(14)
          .font('Roboto-Italic')
          .fillColor(colors.lightGray)
          .text('No hay evaluaciones disponibles.', { align: 'right' });
      }

      if (index < projects.length - 1) {
        doc.addPage();
      }
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
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = generateUniqueFilename('Investigator_Evaluations_Report', 'pdf');
  const filePath = path.join(ensureExportDirExists(), filename);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    setupDocument(doc);

    evaluations.forEach((evaluation, index) => {
      addHeader(doc, 'Informe de Evaluaciones de Mis Proyectos');
      addSection(doc, evaluation.project?.nombre || 'Proyecto desconocido', [
        `Puntuación: ${evaluation.puntuacion || 'N/A'}`,
        `Comentarios: ${evaluation.comentarios || 'N/A'}`,
        `Fecha de evaluación: ${formatDate(evaluation.fechaEvaluacion)}`
      ]);

      // Visual score bar
      const scoreWidth = 200;
      const scoreHeight = 20;
      const scoreX = (doc.page.width - scoreWidth) / 2;
      const scoreY = doc.y;
      
      doc.rect(scoreX, scoreY, scoreWidth, scoreHeight).stroke(colors.primary)
        .rect(scoreX, scoreY, (evaluation.puntuacion / 5) * scoreWidth, scoreHeight)
      
      doc.fontSize(12)
        .fillColor(colors.secondary)
        .text(`${evaluation.puntuacion} / 5`, scoreX, scoreY + scoreHeight + 5, { width: scoreWidth, align: 'center' });

      doc.moveDown(2);

      if (index < evaluations.length - 1) {
        doc.addPage();
      }
    });

    doc.end();

    stream.on('finish', () => resolve({ filePath, filename }));
    stream.on('error', reject);
  });
};