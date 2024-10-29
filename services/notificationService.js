import Notification from '../models/Notification.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

class NotificationService {
  // #region Crear una notificación ********************************************** //
  static async createNotification({ recipientId, senderId, type, message, data }) {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      data,
    });
    await notification.save();
    return notification;
  }

  // #endregion ********************************************************************//

  // #region Obtener todas las notificaciones ********************************************** //
  static async getAllNotifications(filters, page = 1, limit = 10, userRole) {
    const query = {};

    if (userRole === 'Administrador') {
      if (filters.isDeleted !== undefined) {
        query.isDeleted = filters.isDeleted;
      } else {
        query.isDeleted = false; // Por defecto, no mostrar eliminadas
      }
    }

    // Aplicar filtros
    if (filters.type) {
      query.type = new RegExp(`^${filters.type}$`, 'i');
    }

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    // Calcular el total de documentos que coinciden con los filtros
    const total = await Notification.countDocuments(query);

    // Obtener notificaciones con paginación y filtros
    const notifications = await Notification.find(query)
      .populate('recipient', 'nombre apellido email')
      .populate('sender', 'nombre apellido email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return {
      notifications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }
  // #endregion ********************************************************************//

  // #region Obtener notificaciones del usuario autenticado  ********************************************** //
  static async getUserNotifications(userId, filters = {}, page = 1, limit = 10) {
    const query = { recipient: userId, isDeleted: false };

    // Aplicar filtros
    if (filters.type) {
      query.type = new RegExp(`^${filters.type}$`, 'i');
    }

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    // Calcular el total de documentos que coinciden con los filtros
    const total = await Notification.countDocuments(query);

    // Obtener notificaciones con paginación y filtros
    const notifications = await Notification.find(query)
      .populate('recipient', 'nombre apellido email')
      .populate('sender', 'nombre apellido email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return {
      notifications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }
  // #endregion ********************************************************************//

  // #region Obtener notificaciones de un usuario ********************************************** //
  static async getNotifications(userId) {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'nombre apellido email')
      .exec();
    return notifications;
  }
  // #endregion ********************************************************************//

  // #region Marcar notificación como leída ********************************************** //
  static async markAsRead(id, userId) {
    const notification = await Notification.findOne({ _id: id, recipient: userId });
    if (!notification) {
      throw new NotFoundError('Notificación no encontrada');
    }

    if (notification.isRead === true) {
      throw new ConflictError('Esta notificacion ya fue marcada como leida.')
    }

    notification.isRead = true;
    await notification.save();
    return notification;
  }
  // #endregion ********************************************************************//

  // #region  Marcar todas las notificaciones como leídas ********************************************** //
  static async markAllAsRead(userId) {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  }
  // #endregion ********************************************************************//

  // #region *********************** Deshabilitando la notificacion ******************* //
  static async deleteNotification(id) {
    const notification = await Notification.findOne({ _id: id });
    if (!notification) {
      throw new NotFoundError('Notificación no encontrada');
    }

    if (notification.isDeleted) {
      throw new BadRequestError('Esta notificación ya está deshabilitada.');
    }

    notification.isDeleted = true;
    await notification.save();

    return notification;
  }
  // #endregion ****************************************************************** //

  // #region *********************** Habilitando el Usuario ******************* //
  static async restoreNotification(id, userRole) {
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para restaurar esta notificación.');
    }
  
    const notification = await Notification.findOne({ _id: id, isDeleted: true });
    if (!notification) {
      throw new NotFoundError('Notificación no encontrada o no está eliminada.');
    }
  
    notification.isDeleted = false;
    await notification.save();
  
    return notification;
  }
  // #endregion ****************************************************************** //
}

export default NotificationService;