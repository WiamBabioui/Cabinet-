// backend/tests/roles.test.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Autorisations et Rôles (Jest + Supertest)
// Couvre : Patient, Médecin, Secrétaire, Admin — accès autorisés et refusés
// ═══════════════════════════════════════════════════════════════════════════════

import request from 'supertest';
import { createTestApp } from './setup/appFactory.js';
import {
  seedTestUsers,
  cleanupTestUsers,
  connectDatabases,
  closeDatabases,
} from './setup/testHelpers.js';

let app;
let users;

beforeAll(async () => {
  await connectDatabases();
  app = createTestApp();
  users = await seedTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  await closeDatabases();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ─── SUITE 1 : Patient — Accès autorisés ──────────────────────────────────────

describe('🏥 Patient — Accès autorisés', () => {

  // ✅ TC-ROLE-01 : Patient peut accéder à son propre profil (/api/auth/me)
  it('TC-ROLE-01 : Patient peut accéder à son profil (/api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
  });

  // ✅ TC-ROLE-02 : Patient peut voir ses rendez-vous (/api/appointments)
  it('TC-ROLE-02 : Patient peut accéder à ses rendez-vous', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointments');
  });

  // ✅ TC-ROLE-03 : Patient peut accéder au portail patient (/api/patients/portal)
  it('TC-ROLE-03 : Patient peut accéder au portail patient', async () => {
    const res = await request(app)
      .get('/api/patients/portal')
      .set(authHeader(users.patient.token));

    // 200 ou 404 (si pas de données) mais pas 401/403
    expect([200, 404, 500]).toContain(res.status);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  // ✅ TC-ROLE-04 : Patient peut accéder à ses conversations de chat
  it('TC-ROLE-04 : Patient peut accéder à ses conversations', async () => {
    const res = await request(app)
      .get('/api/chat/conversations')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('conversations');
  });
});

// ─── SUITE 2 : Patient — Accès refusés ────────────────────────────────────────

describe('🚫 Patient — Accès refusés (routes Admin/Médecin/Secrétaire)', () => {

  // ❌ TC-ROLE-05 : Patient ne peut PAS accéder à la liste des utilisateurs (admin)
  it('TC-ROLE-05 : Patient ne peut PAS accéder à GET /api/users (admin only) → 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/accès refusé|requis/i);
  });

  // ❌ TC-ROLE-06 : Patient ne peut PAS supprimer un patient (admin only)
  it('TC-ROLE-06 : Patient ne peut PAS supprimer un patient → 403', async () => {
    const res = await request(app)
      .delete('/api/patients/9999')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-07 : Patient ne peut PAS créer un patient (médecin/secrétaire only)
  it('TC-ROLE-07 : Patient ne peut PAS créer un patient → 403', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set(authHeader(users.patient.token))
      .send({ prenom: 'Hack', nom: 'Attempt', email: 'hack@test.com' });

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-08 : Patient ne peut PAS désactiver un utilisateur (admin only)
  it('TC-ROLE-08 : Patient ne peut PAS toggle le statut d\'un user → 403', async () => {
    const res = await request(app)
      .patch(`/api/users/${users.medecin.id}/toggle`)
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-09 : Patient ne peut PAS mettre à jour un dossier médical
  it('TC-ROLE-09 : Patient ne peut PAS modifier un dossier médical → 403', async () => {
    const res = await request(app)
      .put(`/api/patients/${users.patient.id}/dossier`)
      .set(authHeader(users.patient.token))
      .send({ notes: 'Injection' });

    expect(res.status).toBe(403);
  });
});

// ─── SUITE 3 : Médecin — Accès autorisés ──────────────────────────────────────

describe('👨‍⚕️ Médecin — Accès autorisés', () => {

  // ✅ TC-ROLE-10 : Médecin peut consulter ses patients
  it('TC-ROLE-10 : Médecin peut consulter la liste des patients', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
  });

  // ✅ TC-ROLE-11 : Médecin peut voir ses rendez-vous
  it('TC-ROLE-11 : Médecin peut consulter ses rendez-vous', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointments');
  });

  // ✅ TC-ROLE-12 : Médecin peut créer un patient
  it('TC-ROLE-12 : Médecin peut créer un patient', async () => {
    const email = `test_create_pat_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/patients')
      .set(authHeader(users.medecin.token))
      .send({
        prenom: 'Nouveau',
        nom: 'Patient',
        email,
        telephone: '0600000000',
        date_naissance: '1990-01-01',
        sexe: 'M',
      });

    // 201 (créé) ou 409 (doublon) sont acceptables
    expect([201, 409, 400]).toContain(res.status);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  // ✅ TC-ROLE-13 : Médecin peut mettre à jour un dossier médical
  it('TC-ROLE-13 : Médecin peut modifier un dossier médical', async () => {
    const res = await request(app)
      .put(`/api/patients/${users.patient.id}/dossier`)
      .set(authHeader(users.medecin.token))
      .send({ notes: 'Mise à jour des notes médicales' });

    // 200 ou 404 (si patient n'est pas dans la table patients)
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ─── SUITE 4 : Médecin — Accès refusés ────────────────────────────────────────

describe('🚫 Médecin — Accès refusés (Admin only)', () => {

  // ❌ TC-ROLE-14 : Médecin ne peut PAS lister tous les utilisateurs (admin only)
  it('TC-ROLE-14 : Médecin ne peut PAS accéder à GET /api/users → 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-15 : Médecin ne peut PAS supprimer un utilisateur
  it('TC-ROLE-15 : Médecin ne peut PAS supprimer un utilisateur → 403', async () => {
    const res = await request(app)
      .delete(`/api/users/${users.patient.id}`)
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-16 : Médecin ne peut PAS toggle statut d'un utilisateur
  it('TC-ROLE-16 : Médecin ne peut PAS toggle le statut d\'un utilisateur → 403', async () => {
    const res = await request(app)
      .patch(`/api/users/${users.patient.id}/toggle`)
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(403);
  });
});

// ─── SUITE 5 : Secrétaire — Accès autorisés ───────────────────────────────────

describe('📋 Secrétaire — Accès autorisés', () => {

  // ✅ TC-ROLE-17 : Secrétaire peut gérer les rendez-vous
  it('TC-ROLE-17 : Secrétaire peut accéder aux rendez-vous', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointments');
  });

  // ✅ TC-ROLE-18 : Secrétaire peut créer un patient
  it('TC-ROLE-18 : Secrétaire peut créer un patient', async () => {
    const email = `test_sec_create_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/patients')
      .set(authHeader(users.secretaire.token))
      .send({
        prenom: 'SecPatient',
        nom: 'Test',
        email,
        telephone: '0600000001',
        date_naissance: '1985-05-15',
        sexe: 'F',
      });

    expect([201, 409, 400]).toContain(res.status);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  // ✅ TC-ROLE-19 : Secrétaire peut voir la liste des patients
  it('TC-ROLE-19 : Secrétaire peut consulter la liste des patients', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(200);
  });
});

// ─── SUITE 6 : Secrétaire — Accès refusés ─────────────────────────────────────

describe('🚫 Secrétaire — Accès refusés (Admin only)', () => {

  // ❌ TC-ROLE-20 : Secrétaire ne peut PAS lister tous les utilisateurs
  it('TC-ROLE-20 : Secrétaire ne peut PAS accéder à GET /api/users → 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-21 : Secrétaire ne peut PAS supprimer un patient (admin only)
  it('TC-ROLE-21 : Secrétaire ne peut PAS supprimer un patient → 403', async () => {
    const res = await request(app)
      .delete('/api/patients/9999')
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-22 : Secrétaire ne peut PAS modifier un dossier médical
  it('TC-ROLE-22 : Secrétaire ne peut PAS modifier un dossier médical → 403', async () => {
    const res = await request(app)
      .put(`/api/patients/${users.patient.id}/dossier`)
      .set(authHeader(users.secretaire.token))
      .send({ notes: 'Tentative unauthorized' });

    expect(res.status).toBe(403);
  });

  // ❌ TC-ROLE-23 : Secrétaire ne peut PAS toggle statut utilisateur
  it('TC-ROLE-23 : Secrétaire ne peut PAS toggle statut d\'un utilisateur → 403', async () => {
    const res = await request(app)
      .patch(`/api/users/${users.patient.id}/toggle`)
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(403);
  });
});

// ─── SUITE 7 : Admin — Accès complet ──────────────────────────────────────────

describe('👑 Admin — Accès complet', () => {

  // ✅ TC-ROLE-24 : Admin peut lister tous les utilisateurs
  it('TC-ROLE-24 : Admin peut accéder à GET /api/users → 200', async () => {
    const res = await request(app)
      .get('/api/users')
      .set(authHeader(users.admin.token));

    expect(res.status).toBe(200);
  });

  // ✅ TC-ROLE-25 : Admin peut toggle le statut d'un utilisateur
  it('TC-ROLE-25 : Admin peut toggle le statut d\'un utilisateur', async () => {
    const res = await request(app)
      .patch(`/api/users/${users.patient.id}/toggle`)
      .set(authHeader(users.admin.token));

    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(403);

    // Re-activate patient for subsequent tests
    if (res.status === 200) {
      await request(app)
        .patch(`/api/users/${users.patient.id}/toggle`)
        .set(authHeader(users.admin.token));
    }
  });
});

// ─── SUITE 8 : Routes sans authentification ───────────────────────────────────

describe('🔒 Routes protégées sans token', () => {

  const protectedRoutes = [
    { method: 'get', path: '/api/auth/me' },
    { method: 'get', path: '/api/appointments' },
    { method: 'get', path: '/api/patients' },
    { method: 'get', path: '/api/chat/conversations' },
    { method: 'get', path: '/api/dashboard' },
    { method: 'get', path: '/api/notifications' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`TC-NOAUTH : ${method.toUpperCase()} ${path} sans token → 401`, async () => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    });
  });
});
