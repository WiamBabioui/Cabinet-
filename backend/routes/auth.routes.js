import express from 'express';
import { signup, login, getMe, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;