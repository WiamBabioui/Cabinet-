import express from 'express';
import { 
  getNotifications, markAsRead, markAllAsRead, 
  deleteNotification, createNotificationFromFrontend 
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/create', createNotificationFromFrontend);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
