import Project from "../models/Project.js";
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
    return newProject;
  }
  // #endregion **************************************************************************************** //

  // #region **************************** Actualizar Proyecto ************************************************* //
  static async updateProject(id, updates, userId, userRole) {
    const project = await Project.findById(id);
    if (!project || project.isDeleted) {
      throw new NotFoundError("Proyecto no encontrado o eliminado");
    }

    if (
      userRole !== "Administrador" &&
      !project.investigadores.includes(userId)
    ) {
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

    allowedUpdates.forEach((field) => {
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
          default:
            project[field] = updates[field];
            break;
        }
      }
    });

    await project.save();
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
  }

  static async restoreProject(id, userRole) {
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
  }

  // #endregion **************************************************************************************** //

  // #region **************************** Restaurar Proyecto (Revertir Soft Delete) ************************************************* //
  static async restoreProject(id, userRole) {
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
    return project;
  }
  // #endregion *************************************************************************************************************** //

  // #region **************************** Seccion de busquedas ************************************************* //

  // #region **************************** Obtener todos los Proyectos con Paginación y Filtrado ************************************************* //

  static async getAllProjects(filters, page = 1, limit = 10) {
    const total = await Project.countDocuments(filters);
    const projects = await Project.find(filters)
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
