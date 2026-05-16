import express from 'express';
import { getActivityLogs, createActivityLog } from '../controllers/activitylog.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getActivityLogs);
router.post('/', createActivityLog); // This might be used by other internal services/controllers

export default router;
