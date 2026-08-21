import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/rbac.middleware.js';
import {
  getAdminUsers, getAdminUserById, createAdminUser, updateAdminUser, deleteAdminUser,
  toggleAdminUserStatus, assignRole, resetUserPassword,
  getRoles, getRolePermissions, updateRolePermissions, getPermissions,
  getAuditLogs, getAdminStats
} from '../controllers/admin.controller.js';

const router = express.Router();

// All administrative endpoints require authentication and Admin role
router.use(protect);
router.use(isAdmin);

// Stats & General
router.get('/stats', getAdminStats);

// User Management CRUD
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);
router.patch('/users/:id/toggle', toggleAdminUserStatus);
router.patch('/users/:id/role', assignRole);
router.post('/users/:id/reset-password', resetUserPassword);

// Role & Permission Management
router.get('/roles', getRoles);
router.get('/roles/:role/permissions', getRolePermissions);
router.put('/roles/:role/permissions', updateRolePermissions);

// Centralized Permission Registry
router.get('/permissions', getPermissions);

// Immutable Audit Logging
router.get('/audit-logs', getAuditLogs);

export default router;
