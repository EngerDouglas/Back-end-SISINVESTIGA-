import express from 'express';
import { auth, authRole } from '../middlewares/auth.js';
import { getAllNotifications, getNotifications, markAsRead, markAllAsRead, deleteNotification, restoreNotification } from '../controllers/notificationController.js';

const NotificationRouter = express.Router();

NotificationRouter.post('/readall', auth, markAllAsRead);
NotificationRouter.put('/:id/read', auth, markAsRead);
NotificationRouter.put('/:id/restore', auth, authRole(['Administrador']), restoreNotification);
NotificationRouter.delete('/:id', auth, deleteNotification);

NotificationRouter.get('/admin/all', auth, authRole(['Administrador']), getAllNotifications);
NotificationRouter.get('/', auth, getNotifications);

export default NotificationRouter;