import Evaluation from '../models/Evaluation.js';
import Project from '../models/Project.js';
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from '../utils/errors.js';

class EvaluationService {
  // ***********************  Creamos la Evaluacion ******************* //
  static async createEvaluation(projectId, evaluatorId, evaluationData, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para evaluar proyectos.');
    }

    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const existingEvaluation = await Evaluation.findOne({ project: projectId, evaluator: evaluatorId });
    if (existingEvaluation) {
      throw new ConflictError('Ya has evaluado este proyecto.');
    }

    const evaluation = new Evaluation({
      project: projectId,
      evaluator: evaluatorId,
      puntuacion: evaluationData.puntuacion,
      comentarios: evaluationData.comentarios,
    });

    await evaluation.save();

    project.isEvaluated = true;
    await project.save();

    return evaluation;
  }
  // ***********************  END ******************* //

  // ***********************  Actualizamos la Evaluacion ******************* //
  static async updateEvaluation(evaluationId, evaluatorId, updateData, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para actualizar evaluaciones.');
    }

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluación no encontrada.');
    }

    if (!evaluation.evaluator.equals(evaluatorId)) {
      throw new ForbiddenError('No tienes permisos para actualizar esta evaluación.');
    }

    if (updateData.puntuacion !== undefined) evaluation.puntuacion = updateData.puntuacion;
    if (updateData.comentarios !== undefined) evaluation.comentarios = updateData.comentarios;

    await evaluation.save();
    return evaluation;
  }
    // ***********************  END ******************* //

  // ***********************  Obtenemos la Evaluacion por Proyecto ******************* //
  static async getEvaluationsByProject(projectId) {
    const project = await Project.findOne({ _id: projectId, isDeleted: false })

    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const evaluations = await Evaluation.find({ project: projectId, isDeleted: false })
      .populate('evaluator', 'nombre apellido email')
      .populate({ path: 'project', select: 'nombre descripcion objetivos presupuesto' });

    return evaluations;
  }
    // ***********************  END ******************* //

  // ***********************  Eliminamos la Evaluacion ******************* //
  static async deleteEvaluation(evaluationId, evaluatorId, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para eliminar evaluaciones.');
    }

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluación no encontrada.');
    }

    if (!evaluation.evaluator.equals(evaluatorId)) {
      throw new ForbiddenError('No tienes permisos para eliminar esta evaluación.');
    }

    evaluation.isDeleted = true;
    await evaluation.save();

    return { message: 'Evaluación eliminada exitosamente.' };
  }
    // ***********************  END ******************* //

  // ***********************  Restauramos la Evaluacion ******************* //
  static async restoreEvaluation(evaluationId, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para restaurar evaluaciones.');
    }

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundError('Evaluación no encontrada.');
    }

    if (!evaluation.isDeleted) {
      throw new BadRequestError('La evaluación no está eliminada.');
    }

    evaluation.isDeleted = false;
    await evaluation.save();

    return evaluation;
  }
  // ***********************  END ******************* //
}

export default EvaluationService;