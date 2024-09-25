// controllers/solicitudController.js
import Request from '../models/Request.js'; // Asegúrate de tener un modelo Solicitud
import { validationResult } from 'express-validator';

// **************************** Crear Solicitud ************************************************* //
export const createRequest = async (req, res, next) => {
  try {
    // Validar errores usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      proyectoId,
      investigadorId,
      motivo
    } = req.body;

    // Crear nueva solicitud
    const newRequest = new Request({
      proyectoId,
      investigadorId,
      motivo,
      fechaSolicitud: new Date(),
      estado: 'Pendiente' // Estado por defecto
    });

    // Guardar en la base de datos
    await newRequest.save();

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      solicitud: newRequest
    });
  } catch (error) {
    next(error); // Utilizamos un middleware centralizado para manejar errores
  }
};
// **************************** END ************************************************ //

// **************************** Actualizar Solicitud ************************************************* //
export const updateRequest = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Validar errores usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Revisar si la solicitud existe
    const solicitud = await Request.findById(id);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Actualizar los campos permitidos
    const allowedUpdates = ['estado', 'comentariosAdministrador', 'fechaRevision'];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        solicitud[field] = updates[field];
      }
    });

    // Guardar la solicitud actualizada
    await solicitud.save();
    res.status(200).json({
      message: 'Solicitud actualizada correctamente',
      solicitud
    });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //

// **************************** Eliminar Solicitud ************************************************* //
export const deleteRequest = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Verificar si la solicitud existe
    const solicitud = await Request.findById(id);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Eliminar la solicitud
    await solicitud.remove();

    res.status(200).json({ message: 'Solicitud eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //

// **************************** Obtener todas las Solicitudes con Paginación y Filtrado ************************************************* //
export const getAllRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado } = req.query;

    // Filtros básicos
    const filter = {};
    if (estado) filter.estado = estado;

    // Paginación
    const solicitudes = await Request.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadorId', 'nombre apellido') // Asegúrate de tener los campos correctos en tu modelo
      .populate('proyectoId', 'nombre');

    res.status(200).json(solicitudes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las solicitudes', error: error.message });
  }
};
// **************************** END ************************************************ //

// **************************** Obtener Solicitud por ID ************************************************* //
export const getRequestById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const solicitud = await Request.findById(id)
      .populate('investigadorId', 'nombre apellido')
      .populate('proyectoId', 'nombre');

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.status(200).json(solicitud);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //
