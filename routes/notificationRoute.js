import express from 'express';
import { auth, authRole } from '../middlewares/auth.js';
import { getAllNotifications, getUserNotifications, getNotifications, markAsRead, unMarkAsRead, markAllAsRead, unMarkAllAsRead, deleteNotification, restoreNotification } from '../controllers/notificationController.js';

const NotificationRouter = express.Router();

NotificationRouter.post('/readall', auth, markAllAsRead);
NotificationRouter.post('/unreadall', auth, unMarkAllAsRead);
NotificationRouter.put('/:id/read', auth, markAsRead);
NotificationRouter.put('/:id/unread', auth, unMarkAsRead);
NotificationRouter.put('/:id/restore', auth, authRole(['Administrador']), restoreNotification);
NotificationRouter.delete('/:id', auth, deleteNotification);

NotificationRouter.get('/admin/all', auth, authRole(['Administrador']), getAllNotifications);
NotificationRouter.get('/me', auth, getUserNotifications);
NotificationRouter.get('/', auth, getNotifications);

export default NotificationRouter;