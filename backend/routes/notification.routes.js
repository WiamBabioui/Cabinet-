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
// ⚠️  /read-all MUST be declared BEFORE /:id/read
// Otherwise Express matches 'read-all' as the :id param and never reaches this handler
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;