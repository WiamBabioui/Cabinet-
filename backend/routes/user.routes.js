import express from 'express';
import {
  getUsers, getUserById, updateUser,
  toggleUserStatus, deleteUser, getSpecialites
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ✅ PUBLIQUE — avant protect
router.get('/specialites', getSpecialites);

// 🔒 Routes protégées
router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/toggle', authorize('admin'), toggleUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;