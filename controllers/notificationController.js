import NotificationService from '../services/notificationService.js';

// #region Obtener notificaciones de un usuario ********************************************** //
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationService.getNotifications(req.user._id);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};
// #endregion ********************************************************************//

// #region Obtener todas las notificaciones ********************************************** //
export const getAllNotifications = async (req, res, next) => {
  try {
    // Obtener parámetros de consulta
    const { page, limit, type, isRead, isDeleted } = req.query;

    const filters = {};

    if (type) filters.type = type;
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (isDeleted !== undefined) filters.isDeleted = isDeleted === 'true';

    const userRole = req.userRole;

    const notifications = await NotificationService.getAllNotifications(filters, parseInt(page), parseInt(limit), userRole);

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};
// #endregion ********************************************************************//

// #region Obtener notificaciones del usuario autenticado ********************************************** //
export const getUserNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, isRead } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }

    if (isRead !== undefined) {
      filters.isRead = isRead === 'true';
    }

    const result = await NotificationService.getUserNotifications(req.user._id, filters, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
// #endregion ********************************************************************//

// #region Marcar notificación como leída ********************************************** //
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id, req.user._id);
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};
// #endregion ********************************************************************//

// #region  Marcar todas las notificaciones como leídas ********************************************** //
export const markAllAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    res.status(200).json({ message: 'Todas las notificaciones han sido marcadas como leídas' });
  } catch (error) {
    next(error);
  }
};
// #endregion ********************************************************************//

// #region Eliminar Solicitud ************************************************* //
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.deleteNotification(id);
    res.status(200).json({ message: 'Notificación eliminada exitosamente.', notification });
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Restaurar Solicitud ************************************************* //
export const restoreNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.restoreNotification(id, req.userRole);
    res.status(200).json({ message: 'Notificación restaurada exitosamente.', notification });
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //