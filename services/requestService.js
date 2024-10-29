import Request from '../models/Request.js';
import Project from '../models/Project.js';
import NotificationService from './notificationService.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

class RequestService {
  // #region **************************** Crear Solicitud ************************************************* //
  static async createRequest(requestData, userId) {
    const { tipoSolicitud, descripcion, proyecto } = requestData;

    if (!tipoSolicitud || !descripcion) {
      throw new BadRequestError('Tipo de solicitud y descripción son obligatorios.');
    }

    if (['Unirse a Proyecto', 'Recursos', 'Aprobación'].includes(tipoSolicitud) && !proyecto) {
      throw new BadRequestError('El proyecto es obligatorio para este tipo de solicitud.');
    }

    if (proyecto) {
      const projectExists = await Project.findById(proyecto);
      if (!projectExists) {
        throw new NotFoundError('Proyecto no encontrado.');
      }
    }

    const newRequest = new Request({
      solicitante: userId,
      tipoSolicitud,
      descripcion,
      proyecto,
    });

    await newRequest.save();
    
    // Obtener los administradores
    const adminRole = await Role.findOne({ roleName: 'Administrador' });
    const admins = await User.find({ role: adminRole._id }).select('_id');

    // Obtener el solicitante
    const user = await User.findById(userId).select('nombre apellido');

    // Crear notificaciones para los administradores
    for (const admin of admins) {
      await NotificationService.createNotification({
        recipientId: admin._id,
        senderId: userId,
        type: 'Solicitud',
        message: `Nueva solicitud creada por ${user.nombre} ${user.apellido}: ${tipoSolicitud}.`,
        data: { requestId: newRequest._id },
      });
    }

    return newRequest;
  }

  // #endregion ******************************************************************************************* //

  // #region **************************** Actualizar Solicitud  ************************************************* //
  static async updateRequest(id, updateData, userId, userRole) {
    const { estado, comentarios } = updateData;
    const solicitud = await Request.findOne({ _id: id, isDeleted: false });

    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada.');
    }

    if (estado && userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permiso para actualizar el estado de esta solicitud.');
    }

    if (estado) {
      solicitud.estado = estado;
      solicitud.revisadoPor = userId;
      solicitud.fechaResolucion = new Date();
  
      // Crear notificación para el solicitante
      await NotificationService.createNotification({
        recipientId: solicitud.solicitante._id,
        senderId: userId,
        type: 'Solicitud',
        message: `Tu solicitud ha sido actualizada a estado: ${estado}.`,
        data: { requestId: solicitud._id },
      });
    }
  
    if (comentarios) {
      solicitud.comentarios.push({
        usuario: userId,
        comentario: comentarios,
      });
    }

    await solicitud.save();
    return solicitud;
  }

  // #endregion *************************************************************************************** //

  // #region **************************** Eliminar Solicitud ************************************************* //
  static async deleteRequest(id, userId, userRole) {
    const solicitud = await Request.findOne({ _id: id, isDeleted: false });

    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada.');
    }

    if (!solicitud.solicitante.equals(userId) && userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permiso para eliminar esta solicitud.');
    }

    solicitud.isDeleted = true;
    await solicitud.save();
    return { message: 'Solicitud eliminada exitosamente (soft delete).' };
  }

  // #endregion ********************************************************************************************* //


  // #region **************************** Restaurar Solicitud ************************************************* //
  static async restoreRequest(id, userRole) {
    const solicitud = await Request.findOne({ _id: id, isDeleted: true });

    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada o no está eliminada.');
    }

    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permiso para restaurar esta solicitud.');
    }

    solicitud.isDeleted = false;
    await solicitud.save();
    return solicitud;
  }

  // #endregion ********************************************************************************************* //

  // #region Seccion de Busqueda ********************************************************************************************* //

  // #region **************************** Obtener todas las Solicitudes con Paginación y Filtrado ************************************************* //
  static async getAllRequests(filters, page = 1, limit = 10, userId, userRole) {
    const query = { ...filters };

    if (userRole === 'Investigador') {
      query.solicitante = userId;
    }

    const total = await Request.countDocuments(query);
    const solicitudes = await Request.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('solicitante', 'nombre apellido email')
      .populate('proyecto', 'nombre descripcion')
      .populate('revisadoPor', 'nombre apellido email')
      .lean();

    return {
      solicitudes,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  // #endregion ********************************************************************************************* //

  // #region **************************** Obtener Solicitud por ID ************************************************* //
  static async getRequestById(id, userId, userRole) {
    const solicitud = await Request.findOne({ _id: id, isDeleted: false })
      .populate('solicitante', 'nombre apellido email')
      .populate('proyecto', 'nombre descripcion')
      .populate('revisadoPor', 'nombre apellido email')
      .populate('comentarios.usuario', 'nombre apellido email')
      .lean();

    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    if (userRole === 'Investigador' && !solicitud.solicitante.equals(userId)) {
      throw new ForbiddenError('No tienes permiso para ver esta solicitud.');
    }

    return solicitud;
  }

  // #endregion ********************************************************************************************* //

    // #region **************************** Obtener Solicitud por ID Administradores ************************************************* //
    static async getRequestIdByAdmin(id) {
      const solicitud = await Request.findOne({ _id: id })
        .populate('solicitante', 'nombre apellido email')
        .populate('proyecto', 'nombre descripcion')
        .populate('revisadoPor', 'nombre apellido email')
        .populate('comentarios.usuario', 'nombre apellido email')
        .lean();
  
      if (!solicitud) {
        throw new NotFoundError('Solicitud no encontrada');
      }
  
      return solicitud;
    }
  
    // #endregion ********************************************************************************************* //

  // #region **************************** Obtener Propia Solicitud ************************************************* //
  static async getUserRequests(userId, filters, page = 1, limit = 10) {
    const query = { solicitante: userId, isDeleted: false, ...filters };

    const total = await Request.countDocuments(query);
    const solicitudes = await Request.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('solicitante', 'nombre apellido email')
      .populate('proyecto', 'nombre descripcion')
      .populate('revisadoPor', 'nombre apellido email')
      .lean();

    return {
      solicitudes,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }
  // #endregion ********************************************************************************************* //

  // #endregion Seccion de Busqueda ************************************************************************************************************* //
}

export default RequestService