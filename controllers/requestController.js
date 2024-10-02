import Request from "../models/Request.js";
import Project from "../models/Project.js";
import { validationResult } from "express-validator";

// **************************** Crear Solicitud ************************************************* //
export const createRequest = async (req, res) => {
  try {
    const { tipoSolicitud, descripcion, proyecto } = req.body;

    // Validaciones
    if (!tipoSolicitud || !descripcion) {
      return res
        .status(400)
        .json({ error: "Tipo de solicitud y descripción son obligatorios." });
    }

    // Si el tipo de solicitud requiere un proyecto
    if (
      ["Unirse a Proyecto", "Recursos", "Aprobación"].includes(tipoSolicitud) &&
      !proyecto
    ) {
      return res.status(400).json({
        error: "El proyecto es obligatorio para este tipo de solicitud.",
      });
    }

    // Verificamos si el proyecto existe
    if (proyecto) {
      const projectExists = await Project.findById(proyecto);
      if (!projectExists) {
        return res.status(404).json({ error: "Proyecto no encontrado." });
      }
    }

    const newRequest = new Request({
      solicitante: req.user._id,
      tipoSolicitud,
      descripcion,
      proyecto,
    });

    await newRequest.save();

    res.status(201).json({
      message: "Solicitud creada exitosamente.",
      solicitud: newRequest,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al crear la solicitud.", details: error.message });
  }
};
// **************************** END ************************************************ //

// **************************** Actualizar Solicitud ************************************************* //
export const updateRequest = async (req, res) => {
  const { id } = req.params;
  const { estado, comentarios } = req.body;

  try {
    // Validar errores usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Revisar si la solicitud existe
    const solicitud = await Request.findById(id);
    if (!solicitud || solicitud.isDeleted) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    // Solo el administrador puede actualizar el estado
    if (estado) {
      if (req.userRole !== "Administrador") {
        return res.status(403).json({
          error:
            "No tienes permiso para actualizar el estado de esta solicitud.",
        });
      }
      solicitud.estado = estado;
      solicitud.revisadoPor = req.user._id;
      solicitud.fechaResolucion = new Date();
    }

    // Agregar comentarios
    if (comentarios) {
      solicitud.comentarios.push({
        usuario: req.user._id,
        comentario: comentarios,
      });
    }

    await solicitud.save();

    res
      .status(200)
      .json({ message: "Solicitud actualizada exitosamente.", solicitud });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar la solicitud.",
      details: error.message,
    });
  }
};
// **************************** END ************************************************ //

// **************************** Eliminar Solicitud ************************************************* //
export const deleteRequest = async (req, res, next) => {
  const { id } = req.params;

  try {
    const solicitud = await Request.findById(id);
    if (!solicitud || solicitud.isDeleted) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    // Solo el solicitante o un administrador pueden eliminar la solicitud
    if (
      !solicitud.solicitante.equals(req.user._id) &&
      req.userRole !== "Administrador"
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta solicitud." });
    }

    solicitud.isDeleted = true;
    await solicitud.save();

    res
      .status(200)
      .json({ message: "Solicitud eliminada exitosamente (soft delete)." });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al eliminar la solicitud.",
        details: error.message,
      });
  }
};
// **************************** END ************************************************ //

// **************************** Restaurar Solicitud ************************************************* //
export const restoreRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const solicitud = await Request.findById(id);
    if (!solicitud || !solicitud.isDeleted) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no está eliminada.' });
    }

    // Solo el administrador puede restaurar solicitudes
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permiso para restaurar esta solicitud.' });
    }

    solicitud.isDeleted = false;
    await solicitud.save();

    res.status(200).json({ message: 'Solicitud restaurada exitosamente.', solicitud });
  } catch (error) {
    res.status(500).json({ error: 'Error al restaurar la solicitud.', details: error.message });
  }
};
// **************************** END ************************************************ //


// **************************** Obtener todas las Solicitudes con Paginación y Filtrado ************************************************* //
export const getAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, tipoSolicitud } = req.query;

    // Filtros básicos
    const filter = { isDeleted: false };
    if (estado) filter.estado = estado;
    if (tipoSolicitud) filter.tipoSolicitud = tipoSolicitud;

    // Si el usuario es investigador, solo puede ver sus solicitudes
    if (req.userRole === 'Investigador') {
      filter.solicitante = req.user._id;
    }

    // Paginación
    const solicitudes = await Request.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('solicitante', 'nombre apellido email')
      .populate('proyecto', 'nombre descripcion')
      .populate('revisadoPor', 'nombre apellido email');

    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las solicitudes",
      error: error.message,
    });
  }
};
// **************************** END ************************************************ //

// **************************** Obtener Solicitud por ID ************************************************* //
export const getRequestById = async (req, res) => {
  const { id } = req.params;

  try {
    const solicitud = await Request.findOne({ _id: id, isDeleted: false })
      .populate('solicitante', 'nombre apellido email')
      .populate('proyecto', 'nombre descripcion')
      .populate('revisadoPor', 'nombre apellido email')
      .populate('comentarios.usuario', 'nombre apellido email');

    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    // Si el usuario es investigador y no es el solicitante, no puede ver la solicitud
    if (req.userRole === 'Investigador' && !solicitud.solicitante.equals(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta solicitud.' });
    }

    res.status(200).json(solicitud);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la solicitud.', details: error.message });
  }
};
// **************************** END ************************************************ //

// **************************** Obtener Propia Solicitud ************************************************* //
export const getUserRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, tipoSolicitud } = req.query;

    const filter = { solicitante: req.user._id, isDeleted: false }; // Solo solicitudes del investigador
    if (estado) filter.estado = estado;
    if (tipoSolicitud) filter.tipoSolicitud = tipoSolicitud;

    // Buscar solicitudes con paginación
    const solicitudes = await Request.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('solicitante', 'nombre apellido email')
      .populate('proyecto', 'nombre descripcion')
      .populate('revisadoPor', 'nombre apellido email');

    // Contar total de solicitudes
    const totalSolicitudes = await Request.countDocuments(filter);

    // Enviar respuesta estándar
    res.status(200).json({
      total: totalSolicitudes,
      page: Number(page),
      limit: Number(limit),
      data: solicitudes.length ? solicitudes : [],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las solicitudes",
      error: error.message,
    });
  }
};
// **************************** END ************************************************ //
