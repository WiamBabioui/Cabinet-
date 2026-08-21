import request from 'supertest';
import { createTestApp } from './setup/appFactory.js';
import {
  seedTestUsers,
  cleanupTestUsers,
  connectDatabases,
  closeDatabases,
  generateToken,
  generateExpiredToken
} from './setup/testHelpers.js';
import pool from '../config/db.mysql.js';

let app;
let users;
let deactivatedAdminIds = [];

beforeAll(async () => {
  await connectDatabases();
  app = createTestApp();
  
  // Find all active admin users in the database that are NOT test users
  const [rows] = await pool.execute(
    "SELECT id FROM utilisateurs WHERE role = 'admin' AND actif = 1 AND email NOT LIKE 'test_jest_%'"
  );
  
  deactivatedAdminIds = rows.map(r => r.id);
  
  // Temporarily deactivate them to isolate the test suite to exactly 1 active admin
  if (deactivatedAdminIds.length > 0) {
    const placeholders = deactivatedAdminIds.map(() => '?').join(',');
    await pool.execute(
      `UPDATE utilisateurs SET actif = 0 WHERE id IN (${placeholders})`,
      deactivatedAdminIds
    );
  }
  
  users = await seedTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  
  // Restore the temporarily deactivated admin users
  if (deactivatedAdminIds.length > 0) {
    const placeholders = deactivatedAdminIds.map(() => '?').join(',');
    await pool.execute(
      `UPDATE utilisateurs SET actif = 1 WHERE id IN (${placeholders})`,
      deactivatedAdminIds
    );
  }
  
  await closeDatabases();
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe('👑 Admin Console & RBAC System Tests', () => {

  // 1. Authentication & Role-based access checks
  describe('🔒 Access Control and Route Protection', () => {
    it('should deny access if token is missing (401)', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should deny access if token is expired (401)', async () => {
      const expiredToken = generateExpiredToken(users.admin.id);
      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(expiredToken));
      expect(res.status).toBe(401);
    });

    it('should deny access to non-admin users (403)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(users.medecin.token));
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/accès refusé|administrateur requis/i);
    });

    it('should allow access to admin users (200)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('roles');
      expect(res.body).toHaveProperty('status');
    });
  });

  // 2. User management operations
  describe('👤 User Management CRUD and Safeguards', () => {
    let createdUserId;

    it('should allow admin to list users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users?limit=5&page=1')
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('total');
    });

    it('should allow admin to create a new user', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set(authHeader(users.admin.token))
        .send({
          prenom: 'Seeded',
          nom: 'Secretary',
          email: 'test_jest_seeded_sec@test.com',
          mot_de_passe: 'SeededPassword123!',
          role: 'secretaire',
          telephone: '0612345678',
          assigned_doctor_id: users.medecin.id
        });
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      createdUserId = res.body.user.id;
    });

    it('should prevent admin from creating a user with an existing email', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set(authHeader(users.admin.token))
        .send({
          prenom: 'Duplicate',
          nom: 'User',
          email: 'test_jest_seeded_sec@test.com',
          mot_de_passe: 'SeededPassword123!',
          role: 'secretaire'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/déjà utilisé/i);
    });

    it('should allow admin to update a user', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${createdUserId}`)
        .set(authHeader(users.admin.token))
        .send({
          prenom: 'SeededUpdated',
          nom: 'SecretaryUpdated',
          email: 'test_jest_seeded_sec_updated@test.com',
          role: 'secretaire',
          telephone: '0699999999',
          actif: 1,
          assigned_doctor_id: users.medecin.id
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/mis à jour/i);
    });

    it('should allow admin to toggle user status', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}/toggle`)
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body.actif).toBe(false);
    });

    it('should prevent deactivating the last active admin', async () => {
      // Since the setup seeds exactly one admin: users.admin
      const res = await request(app)
        .patch(`/api/admin/users/${users.admin.id}/toggle`)
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/dernier administrateur actif/i);
    });

    it('should prevent removing the admin role from the last active admin', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${users.admin.id}/role`)
        .set(authHeader(users.admin.token))
        .send({ role: 'medecin' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/dernier administrateur actif/i);
    });

    it('should allow admin to assign a new role to a non-last-admin user', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}/role`)
        .set(authHeader(users.admin.token))
        .send({ role: 'patient' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/mis à jour/i);
    });

    it('should allow admin to delete user', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${createdUserId}`)
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/supprimé/i);
    });

    it('should prevent admin from deleting their own account', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${users.admin.id}`)
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/supprimer votre propre compte/i);
    });
  });

  // 3. Role & Permission Management
  describe('🛡️ Role & Permission Matrix Management', () => {
    it('should list all roles and their user counts', async () => {
      const res = await request(app)
        .get('/api/admin/roles')
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('roles');
      expect(res.body.roles.length).toBe(4);
    });

    it('should get role permissions for secretary role', async () => {
      const res = await request(app)
        .get('/api/admin/roles/secretaire/permissions')
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('permissions');
    });

    it('should prevent modifying permissions for admin role', async () => {
      const res = await request(app)
        .put('/api/admin/roles/admin/permissions')
        .set(authHeader(users.admin.token))
        .send({ permissions: [1, 2, 3] });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/admin/i);
    });

    it('should allow updating permissions for patient role', async () => {
      // Find one permission ID to assign
      const pRes = await request(app)
        .get('/api/admin/permissions')
        .set(authHeader(users.admin.token));
      const permId = pRes.body.permissions[0]?.id;
      expect(permId).toBeDefined();

      const res = await request(app)
        .put('/api/admin/roles/patient/permissions')
        .set(authHeader(users.admin.token))
        .send({ permissions: [permId] });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/mises à jour/i);
    });
  });

  // 4. Immutable Audit Logs
  describe('📋 Immutable System Audit Logging', () => {
    it('should list audit logs with filters', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?limit=5')
        .set(authHeader(users.admin.token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(res.body.logs.length).toBeGreaterThan(0);
      
      // Actor details should be present
      const log = res.body.logs[0];
      expect(log).toHaveProperty('actor_email');
      expect(log).toHaveProperty('action');
    });
  });
});
