import Project from '../models/Project.js';
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from '../utils/errors.js';

class ProjectService {
  // **************************** Crear Proyecto ************************************************* //
  static async createProject(projectData, userId) {
    const existingProject = await Project.findOne({ nombre: projectData.nombre });
    if (existingProject) {
      throw new ConflictError('Ya existe un proyecto con ese nombre');
    }

    if (!projectData.cronograma || !projectData.cronograma.fechaInicio || !projectData.cronograma.fechaFin) {
      throw new BadRequestError('El cronograma debe incluir fechaInicio y fechaFin');
    }

    if (!projectData.hitos || projectData.hitos.length === 0) {
      throw new BadRequestError('Al menos un hito es obligatorio con nombre y fecha');
    }

    projectData.hitos.forEach((hito, index) => {
      if (!hito.nombre || !hito.fecha) {
        throw new BadRequestError(`El hito en la posición ${index + 1} debe tener un nombre y una fecha`);
      }
    });

    // Inicializamos investigadores como un array vacío si no se proporciona
    const investigadores = projectData.investigadores || [];
    
    // Nosotros aseguramos de que el usuario actual esté en la lista de investigadores
    if (!investigadores.includes(userId)) {
      investigadores.push(userId);
    }

    const newProject = new Project({
      ...projectData,
      investigadores,
      hitos: projectData.hitos.map((hito) => ({
        nombre: hito.nombre,
        fecha: hito.fecha,
        entregables: hito.entregable ? [hito.entregable] : [],
      })),
    });

    await newProject.save();
    return newProject;
  }
  // **************************** END ************************************************ //

  // **************************** Actualizar Proyecto ************************************************* //

  static async updateProject(id, updates, userId, userRole) {
    const project = await Project.findById(id);
    if (!project || project.isDeleted) {
      throw new NotFoundError('Proyecto no encontrado o eliminado');
    }

    if (userRole !== 'Administrador' && !project.investigadores.includes(userId)) {
      throw new ForbiddenError('No tienes permisos para actualizar este proyecto');
    }

    if (updates.nombre) {
      const existingProject = await Project.findOne({ nombre: updates.nombre, _id: { $ne: id } });
      if (existingProject) {
        throw new ConflictError('Ya existe un proyecto con ese nombre');
      }
    }

    const allowedUpdates = [
      'nombre', 'descripcion', 'objetivos', 'presupuesto', 'cronograma', 'hitos', 'investigadores', 'recursos', 'estado'
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        switch (field) {
          case 'hitos':
            project.hitos = updates.hitos.map(hito => ({
              nombre: hito.nombre,
              fecha: hito.fecha,
              entregables: hito.entregable ? [hito.entregable] : []
            }));
            break;
          case 'cronograma':
            project.cronograma = {
              fechaInicio: updates.cronograma.fechaInicio,
              fechaFin: updates.cronograma.fechaFin
            };
            break;
          default:
            project[field] = updates[field];
            break;
        }
      }
    });

    await project.save();
    return project;
  }
  // **************************** END ************************************************ //


  // **************************** Eliminar Proyecto (Soft Delete) ************************************************* //


  static async deleteProject(id, userId, userRole) {
    const project = await Project.findById(id);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    const isInvestigador = project.investigadores.some(investigadorId => investigadorId.equals(userId));
    const isAdmin = userRole === 'Administrador';

    if (!isInvestigador && !isAdmin) {
      throw new ForbiddenError('No tienes permisos para eliminar este proyecto.');
    }

    if ((project.estado === 'Finalizado' || project.estado === 'Cancelado') && !isAdmin) {
      throw new ForbiddenError('Solo los administradores pueden eliminar proyectos en estado finalizado o cancelado.');
    }

    project.isDeleted = true;
    await project.save();
  }

  static async restoreProject(id, userRole) {
    const project = await Project.findById(id);
    if (!project || !project.isDeleted) {
      throw new NotFoundError('Proyecto no encontrado o no está eliminado.');
    }

    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para restaurar este proyecto.');
    }

    project.isDeleted = false;
    await project.save();
  }

    // **************************** END ************************************************ //

    // **************************** Restaurar Proyecto (Revertir Soft Delete) ************************************************* //
    static async restoreProject(id, userRole) {
      const project = await Project.findById(id);
      if (!project || !project.isDeleted) {
        throw new NotFoundError('Proyecto no encontrado o no está eliminado.');
      }
  
      if (userRole !== 'Administrador') {
        throw new ForbiddenError('No tienes permisos para restaurar este proyecto.');
      }
  
      project.isDeleted = false;
      await project.save();
      return project;
    }
        // **************************** END ************************************************ //

    // **************************** Seccion de busquedas ************************************************* //

// **************************** Obtener todos los Proyectos con Paginación y Filtrado ************************************************* //

  static async getAllProjects(filters, page, limit) {
    const projects = await Project.find(filters)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadores', 'nombre apellido')
      .populate({
        path: 'evaluaciones',
        match: { isDeleted: false },
        populate: { path: 'evaluator', select: 'nombre apellido email' },
      });

    return projects;
  }

  // **************************** END ************************************************ //

  // **************************** Obtener Proyecto por ID ************************************************* //

  static async getProjectById(id) {
    const project = await Project.findById(id)
      .populate('investigadores', 'nombre apellido especializacion responsabilidades fotoPerfil')
      .populate({
        path: 'evaluaciones',
        match: { isDeleted: false },
        populate: { path: 'evaluator', select: 'nombre apellido email' },
      });

    if (!project || project.isDeleted) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    return project;
  }

  // **************************** END ************************************************ //

// **************************** Obtener Proyectos propios ************************************************* //

  static async getUserProjects(userId, page, limit) {
    const projects = await Project.find({ investigadores: userId, isDeleted: false })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadores', 'nombre apellido')
      .populate({
        path: 'evaluaciones',
        match: { isDeleted: false },
        populate: { path: 'evaluator', select: 'nombre apellido email' },
      });

    const totalProjects = await Project.countDocuments({
      investigadores: userId,
      isDeleted: false,
    });

    return { projects, totalProjects };
  }

  // **************************** END ************************************************ //

// **************************** Búsqueda avanzada por texto completo ************************************************* //
  static async searchProjects(query) {
    const projects = await Project.find({
      $text: { $search: query }
    }).populate('investigadores', 'nombre apellido')
    .populate({
      path: 'evaluaciones',
      match: { isDeleted: false },
      populate: { path: 'evaluator', select: 'nombre apellido email' },
    });

    if (projects.length === 0) {
      throw new NotFoundError('No se encontraron proyectos que coincidan con la búsqueda');
    }

    return projects;
  }
}

export default ProjectService;
// **************************** END ************************************************ //
