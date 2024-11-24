import Project from "../models/Project.js";
import NotificationService from "../services/notificationService.js";
import User from "../models/User.js";
import Role from '../models/Role.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../utils/errors.js";

class ProjectService {
  // #region **************************** Crear Proyecto ************************************************* //
  static async createProject(projectData, userId) {
    const existingProject = await Project.findOne({
      nombre: projectData.nombre,
    });
    if (existingProject) {
      throw new ConflictError("Ya existe un proyecto con ese nombre");
    }

    if (
      !projectData.cronograma ||
      !projectData.cronograma.fechaInicio ||
      !projectData.cronograma.fechaFin
    ) {
      throw new BadRequestError(
        "El cronograma debe incluir fechaInicio y fechaFin"
      );
    }

    if (!projectData.hitos || projectData.hitos.length === 0) {
      throw new BadRequestError(
        "Al menos un hito es obligatorio con nombre y fecha"
      );
    }

    projectData.hitos.forEach((hito, index) => {
      if (!hito.nombre || !hito.fecha) {
        throw new BadRequestError(
          `El hito en la posición ${index + 1} debe tener un nombre y una fecha`
        );
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
      imagen: projectData.imagen,
    });

    await newProject.save();

    // Notificar a los administradores
    const adminUsers = await User.find().populate('role', 'roleName');
    const admins = adminUsers.filter(user => user.role.roleName === 'Administrador');

    admins.forEach(async (admin) => {
      await NotificationService.createNotification({
        recipientId: admin._id,
        senderId: userId,
        type: 'Proyecto',
        message: `Se ha creado un nuevo proyecto "${newProject.nombre}" que requiere su evaluación.`,
        data: { projectId: newProject._id },
      });
    });

    return newProject;
  }
  // #endregion **************************************************************************************** //

  // #region **************************** Actualizar Proyecto ************************************************* //
  static async updateProject(id, updates, userId, userRole) {
    const project = await Project.findById(id);
    if (!project || project.isDeleted) {
      throw new NotFoundError("Proyecto no encontrado o eliminado");
    }

    const isAdmin = userRole === "Administrador";
    const isInvestigador = project.investigadores.includes(userId);

    if (!isAdmin && !isInvestigador) {
      throw new ForbiddenError(
        "No tienes permisos para actualizar este proyecto"
      );
    }

    if (updates.nombre) {
      const existingProject = await Project.findOne({
        nombre: updates.nombre,
        _id: { $ne: id },
      });
      if (existingProject) {
        throw new ConflictError("Ya existe un proyecto con ese nombre");
      }
    }

    const allowedUpdates = [
      "nombre",
      "descripcion",
      "objetivos",
      "presupuesto",
      "cronograma",
      "hitos",
      "investigadores",
      "recursos",
      "estado",
      "imagen",
    ];

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        switch (field) {
          case "hitos":
            project.hitos = updates.hitos.map((hito) => ({
              nombre: hito.nombre,
              fecha: hito.fecha,
              entregables: hito.entregable ? [hito.entregable] : [],
            }));
            break;
          case "cronograma":
            project.cronograma = {
              fechaInicio: updates.cronograma.fechaInicio,
              fechaFin: updates.cronograma.fechaFin,
            };
            break;
          case "imagen":
            project.imagen = updates.imagen;
            break;
          case "investigadores":
            // Validar que los investigadores existen
            const investigadoresIds = updates.investigadores;
           // Obtener el ObjectId del rol "Investigador"
          const roleInvestigador = await Role.findOne({ roleName: 'Investigador' });
          if (!roleInvestigador) {
            throw new Error('El rol Investigador no existe');
          }

          // Buscar los usuarios que sean investigadores
          const investigadoresExistentes = await User.find({
            _id: { $in: investigadoresIds },
            role: roleInvestigador._id,
          });

          if (investigadoresExistentes.length !== investigadoresIds.length) {
            throw new BadRequestError('Algunos investigadores no existen o no tienen el rol de Investigador');
          }

          project.investigadores = investigadoresIds;
          break;
          default:
            project[field] = updates[field];
            break;
        }
      }
    }

    await project.save();

    // Enviar notificaciones a los demás investigadores
    for (const investigatorId of project.investigadores) {
      await NotificationService.createNotification({
        recipientId: investigatorId,
        senderId: userId,
        type: 'Proyecto',
        message: `El proyecto "${project.nombre}" ha sido actualizado.`,
        data: { projectId: project._id },
      });
    }
  
    return project;
  }
  // #endregion **************************************************************************************** //

  // #region **************************** Eliminar Proyecto (Soft Delete) ************************************************* //
  static async deleteProject(id, userId, userRole) {
    const project = await Project.findById(id);
    if (!project) {
      throw new NotFoundError("Proyecto no encontrado");
    }

    const isInvestigador = project.investigadores.some((investigadorId) =>
      investigadorId.equals(userId)
    );
    const isAdmin = userRole === "Administrador";

    if (!isInvestigador && !isAdmin) {
      throw new ForbiddenError(
        "No tienes permisos para eliminar este proyecto."
      );
    }

    if (
      (project.estado === "Finalizado" || project.estado === "Cancelado") &&
      !isAdmin
    ) {
      throw new ForbiddenError(
        "Solo los administradores pueden eliminar proyectos en estado finalizado o cancelado."
      );
    }

    project.isDeleted = true;

    await project.save();

    // Obtener todos los administradores
    const adminUsers = await User.find().populate('role', 'roleName');
    const admins = adminUsers.filter(user => user.role.roleName === 'Administrador');

    // Enviar notificación a cada administrador
    for (const admin of admins) {
      await NotificationService.createNotification({
        recipientId: admin._id,
        senderId: userId,
        type: 'Proyecto',
        message: `El proyecto "${project.nombre}" ha sido eliminado/restaurado.`,
        data: { projectId: project._id },
      });
    }

    // Enviar notificaciones a los investigadores
    for (const investigatorId of project.investigadores) {
      if (!investigatorId.equals(userId)) {
        await NotificationService.createNotification({
          recipientId: investigatorId,
          senderId: userId,
          type: 'Proyecto',
          message: `El proyecto "${project.nombre}" ha sido eliminado.`,
          data: { projectId: project._id },
        });
      }
    }

    return project;
  }
  // #endregion **************************************************************************************** //

  // #region **************************** Restaurar Proyecto (Revertir Soft Delete) ************************************************* //
  static async restoreProject(id, userId, userRole) {
    const project = await Project.findById(id);
    if (!project || !project.isDeleted) {
      throw new NotFoundError("Proyecto no encontrado o no está eliminado.");
    }

    if (userRole !== "Administrador") {
      throw new ForbiddenError(
        "No tienes permisos para restaurar este proyecto."
      );
    }

    project.isDeleted = false;

    await project.save();

    // Enviar notificaciones a los investigadores
    for (const investigatorId of project.investigadores) {
      await NotificationService.createNotification({
        recipientId: investigatorId,
        senderId: userId, // ID del administrador que restauró el proyecto
        type: 'Proyecto',
        message: `El proyecto "${project.nombre}" ha sido restaurado.`,
        data: { projectId: project._id },
      });
    }
    
    return project;
  }
  // #endregion *************************************************************************************************************** //

  // #region **************************** Seccion de busquedas ************************************************* //

  // #region **************************** Obtener todos los Proyectos con Paginación y Filtrado ************************************************* //

  static async getAllProjects(filters, page = 1, limit = 10) {
    const query = {};

    if (filters.search) {
      query.$or = [
        { nombre: new RegExp(filters.search, 'i') },
        { descripcion: new RegExp(filters.search, 'i') },
        { 'investigadores.nombre': new RegExp(filters.search, 'i') },
        { 'investigadores.apellido': new RegExp(filters.search, 'i') }
      ];
    }

    if (filters.estado) {
      query.estado = filters.estado;
    }

    if (filters.selectedProjects && filters.selectedProjects.length > 0) {
      query._id = { $in: filters.selectedProjects };
    }

    if (filters.selectedResearchers && filters.selectedResearchers.length > 0) {
      query['investigadores'] = { $in: filters.selectedResearchers };
    }

    if (filters.startDate) {
      query['cronograma.fechaInicio'] = { $gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      query['cronograma.fechaFin'] = { $lte: new Date(filters.endDate) };
    }

    if (filters.isDeleted !== undefined) {
      query.isDeleted = filters.isDeleted === 'true';
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
      .populate("investigadores", "nombre apellido")
      .populate({
        path: "evaluaciones",
        match: { isDeleted: false },
        populate: { path: "evaluator", select: "nombre apellido email" },
      });

    return {
      projects,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  // #endregion *************************************************************************************************************** //

  // #region **************************** Obtener Proyecto por ID ************************************************* //

  static async getProjectById(id) {
    const project = await Project.findById(id)
      .populate(
        "investigadores",
        "nombre apellido especializacion responsabilidades fotoPerfil"
      )
      .populate({
        path: "evaluaciones",
        match: { isDeleted: false },
        populate: { path: "evaluator", select: "nombre apellido email" },
      });

    if (!project || project.isDeleted) {
      throw new NotFoundError("Proyecto no encontrado");
    }

    return project;
  }

  // #endregion *************************************************************************************************************** //

  // #region **************************** Obtener Proyectos propios ************************************************* //

  static async getUserProjects(userId, page, limit, search) {
    let query = { investigadores: userId, isDeleted: false };

    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { descripcion: { $regex: search, $options: "i" } },
      ];
    }

    const projects = await Project.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("investigadores", "nombre apellido")
      .populate({
        path: "evaluaciones",
        match: { isDeleted: false },
        populate: { path: "evaluator", select: "nombre apellido email" },
      });

    const totalProjects = await Project.countDocuments(query);

    return { projects, totalProjects };
  }

  // #endregion *************************************************************************************************************** //

  // #region **************************** Búsqueda avanzada por texto completo ************************************************* //
  static async searchProjects(query) {
    const projects = await Project.find({
      $text: { $search: query },
    })
      .populate("investigadores", "nombre apellido")
      .populate({
        path: "evaluaciones",
        match: { isDeleted: false },
        populate: { path: "evaluator", select: "nombre apellido email" },
      });

    if (projects.length === 0) {
      throw new NotFoundError(
        "No se encontraron proyectos que coincidan con la búsqueda"
      );
    }

    return projects;
  }

  // #endregion *************************************************************************************************************** //

  // #endregion Seccion de Busqueda *************************************************************** //
}

export default ProjectService;
