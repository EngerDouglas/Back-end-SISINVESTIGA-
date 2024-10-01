import Evaluation from "../models/Evaluation.js";
import Project from "../models/Project.js";

export const createEvaluation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { puntuacion, comentarios } = req.body;

    // Verificamos si el usuario es administrador
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para evaluar proyectos.' });
    }

    // Verificamos si el proyecto existe
    const project = await Project.findById(projectId);
    if (!project || project.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    // Verificamos si ya ha evaluado este proyecto
    const existingEvaluation = await Evaluation.findOne({ project: projectId, evaluator: req.user._id });
    if (existingEvaluation) {
      return res.status(400).json({ error: 'Ya has evaluado este proyecto.' });
    }

    // Creamos la evaluación
    const evaluation = new Evaluation({
      project: projectId,
      evaluator: req.user._id,
      puntuacion,
      comentarios,
    });

    await evaluation.save();

    // Actualizamos el estado del proyecto si es necesario
    project.isEvaluated = true;
    await project.save();

    res.status(201).json({ message: 'Evaluación creada exitosamente.', evaluation });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la evaluación.', error: error.message });
  }
};

export const updateEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { puntuacion, comentarios } = req.body;

    // Verifica]mos si el usuario es administrador
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para actualizar evaluaciones.' });
    }

    // Buscamos' la evaluación
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluación no encontrada.' });
    }

    // Verificamos si la evaluación pertenece al usuario
    if (!evaluation.evaluator.equals(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar esta evaluación.' });
    }

    // Actualiz,ps los campos
    if (puntuacion !== undefined) evaluation.puntuacion = puntuacion;
    if (comentarios !== undefined) evaluation.comentarios = comentarios;

    await evaluation.save();

    res.status(200).json({ message: 'Evaluación actualizada exitosamente.', evaluation });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la evaluación.', error: error.message });
  }
};

export const getEvaluationsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verificar si el proyecto existe
    const project = await Project.findById(projectId);
    if (!project || project.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    // Obtener las evaluaciones
    const evaluations = await Evaluation.find({ project: projectId, isDeleted: false  })
      .populate('evaluator', 'nombre apellido email');

    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las evaluaciones.', error: error.message });
  }
};

export const deleteEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    // Verificamos si el usuario es administrador
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar evaluaciones.' });
    }

    // Buscamos la evaluación
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluación no encontrada.' });
    }

    // Verificamos si la evaluación pertenece al usuario
    if (!evaluation.evaluator.equals(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta evaluación.' });
    }

    //Hacemos un soft delete
    evaluation.isDeleted = true;
    await evaluation.save();

    res.status(200).json({ message: 'Evaluación eliminada exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la evaluación.', error: error.message });
  }
};

export const restoreEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    // Verificar si el usuario es administrador
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para restaurar evaluaciones.' });
    }

    // Buscar la evaluación
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluación no encontrada.' });
    }

    // Verificar si la evaluación está eliminada
    if (!evaluation.isDeleted) {
      return res.status(400).json({ error: 'La evaluación no está eliminada.' });
    }

    // Restaurar la evaluación
    evaluation.isDeleted = false;
    await evaluation.save();

    res.status(200).json({ message: 'Evaluación restaurada exitosamente.', evaluation });
  } catch (error) {
    res.status(500).json({ error: 'Error al restaurar la evaluación.', error: error.message });
  }
};