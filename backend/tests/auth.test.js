// backend/tests/auth.test.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Authentification (Jest + Supertest)
// Couvre : login, signup, JWT, routes protégées, déconnexion
// ═══════════════════════════════════════════════════════════════════════════════

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createTestApp } from './setup/appFactory.js';
import {
  seedTestUsers,
  cleanupTestUsers,
  connectDatabases,
  closeDatabases,
  generateToken,
  generateExpiredToken,
} from './setup/testHelpers.js';
import pool from '../config/db.mysql.js';

let app;
let users;
let testLoginEmail;
let testLoginPassword = 'Password123!';

// ─── Global Setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDatabases();
  app = createTestApp();
  users = await seedTestUsers();

  // Create a dedicated login user with known credentials
  testLoginEmail = `test_auth_login_${Date.now()}@cabinet-test.com`;
  const hash = bcrypt.hashSync(testLoginPassword, 10);
  await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, tentatives_connexion)
     VALUES (?, ?, 'patient', 'Auth', 'TestUser', 1, 0)`,
    [testLoginEmail, hash]
  );
});

afterAll(async () => {
  await pool.execute(`DELETE FROM utilisateurs WHERE email = ?`, [testLoginEmail]);
  await cleanupTestUsers();
  await closeDatabases();
});

// ─── SUITE 1 : Connexion ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {

  // ✅ TC-AUTH-01 : Connexion réussie
  it('TC-AUTH-01 : Connexion réussie avec email + mot de passe corrects', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testLoginEmail, mot_de_passe: testLoginPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testLoginEmail);
    expect(res.body.user).not.toHaveProperty('mot_de_passe_hash');
    expect(res.body.message).toBe('Connexion réussie');
  });

  // ✅ TC-AUTH-02 : JWT généré correctement
  it('TC-AUTH-02 : Le JWT retourné est valide et contient l\'ID utilisateur', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testLoginEmail, mot_de_passe: testLoginPassword });

    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET || 'cabinet_plus_test_secret_2024');
    expect(decoded).toHaveProperty('id');
    expect(typeof decoded.id).toBe('number');
    expect(decoded.id).toBeGreaterThan(0);
    expect(decoded).toHaveProperty('exp'); // token expire
    expect(decoded).toHaveProperty('iat'); // token émis
  });

  // ❌ TC-AUTH-03 : Mot de passe incorrect
  it('TC-AUTH-03 : Mot de passe incorrect → 401 sans révéler les détails', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testLoginEmail, mot_de_passe: 'MauvaisMotDePasse!' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/incorrect/i);
    expect(res.body).not.toHaveProperty('token');
  });

  // ❌ TC-AUTH-04 : Email inexistant
  it('TC-AUTH-04 : Email inexistant → 401 (pas de fuite d\'information)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inexistant_zz99@nulle-part.com', mot_de_passe: 'MotDePasse123!' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    // Le message doit être identique au mauvais mdp pour éviter les énumérations
    expect(res.body.message).toMatch(/incorrect/i);
    expect(res.body).not.toHaveProperty('token');
  });

  // ❌ TC-AUTH-05 : Champs manquants
  it('TC-AUTH-05 : Corps vide → erreur serveur gérée', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).not.toHaveProperty('token');
  });

  // ❌ TC-AUTH-06 : Compte désactivé
  it('TC-AUTH-06 : Compte désactivé → 403', async () => {
    const disabledEmail = `test_disabled_${Date.now()}@cabinet-test.com`;
    const hash = bcrypt.hashSync('Password123!', 10);
    await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, ?, 'patient', 'Disabled', 'User', 0)`,
      [disabledEmail, hash]
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: disabledEmail, mot_de_passe: 'Password123!' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/désactivé/i);

    await pool.execute(`DELETE FROM utilisateurs WHERE email = ?`, [disabledEmail]);
  });
});

// ─── SUITE 2 : JWT Middleware ─────────────────────────────────────────────────

describe('GET /api/auth/me — Protection JWT', () => {

  // ❌ TC-JWT-01 : Accès sans token → 401
  it('TC-JWT-01 : Accès à /api/auth/me sans token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token manquant/i);
  });

  // ❌ TC-JWT-02 : Token invalide → 401
  it('TC-JWT-02 : Token JWT invalide (falsifié) → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ceci.nest.pas.un.token');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalide|expiré/i);
  });

  // ❌ TC-JWT-03 : Token expiré → 401
  it('TC-JWT-03 : Token JWT expiré → 401', async () => {
    const expiredToken = generateExpiredToken(users.patient.id);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalide|expiré/i);
  });

  // ❌ TC-JWT-04 : Header mal formaté (sans Bearer)
  it('TC-JWT-04 : Authorization sans Bearer → 401', async () => {
    const token = generateToken(users.patient.id);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', token); // Manque "Bearer "

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token manquant/i);
  });

  // ✅ TC-JWT-05 : Token valide → 200 + données utilisateur
  it('TC-JWT-05 : Token valide → 200 avec données utilisateur (sans mot de passe)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${users.medecin.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).not.toHaveProperty('mot_de_passe_hash');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
  });

  // ❌ TC-JWT-06 : Token signé avec un autre secret → 401
  it('TC-JWT-06 : Token signé avec un faux secret → 401', async () => {
    const fakeToken = jwt.sign({ id: users.patient.id }, 'FAUX_SECRET_PIRATE', { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
  });
});

// ─── SUITE 3 : Inscription (Signup) ──────────────────────────────────────────

describe('POST /api/auth/signup', () => {

  // ✅ TC-SIGNUP-01 : Inscription Admin réussie
  it('TC-SIGNUP-01 : Inscription d\'un admin valide → 201 + token', async () => {
    const newEmail = `test_signup_admin_${Date.now()}@cabinet-test.com`;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        prenom: 'Super',
        nom: 'Admin',
        email: newEmail,
        mot_de_passe: 'Admin123!',
        role: 'admin',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');

    // Cleanup
    await pool.execute(`DELETE FROM utilisateurs WHERE email = ?`, [newEmail]);
  });

  // ❌ TC-SIGNUP-02 : Email déjà utilisé → 400
  it('TC-SIGNUP-02 : Email déjà utilisé → 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        prenom: 'Test',
        nom: 'Doublon',
        email: testLoginEmail, // email déjà existant
        mot_de_passe: 'Password123!',
        role: 'admin',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/déjà utilisé/i);
  });

  // ❌ TC-SIGNUP-03 : Rôle invalide → 400
  it('TC-SIGNUP-03 : Rôle invalide → 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        prenom: 'Hacker',
        nom: 'Test',
        email: `hack_${Date.now()}@test.com`,
        mot_de_passe: 'Password123!',
        role: 'superadmin', // rôle inexistant
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rôle invalide/i);
  });

  // ❌ TC-SIGNUP-04 : Patient sans médecin assigné → 400
  it('TC-SIGNUP-04 : Patient sans assigned_doctor_id → 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        prenom: 'Orphan',
        nom: 'Patient',
        email: `orphan_${Date.now()}@test.com`,
        mot_de_passe: 'Password123!',
        role: 'patient',
        // Pas de assigned_doctor_id
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/médecin assigné/i);
  });
});

// ─── SUITE 4 : Déconnexion ────────────────────────────────────────────────────

describe('Déconnexion (stateless JWT)', () => {

  // ℹ️ La déconnexion JWT est côté client (suppression du token du localStorage)
  // Côté serveur, on vérifie qu'un token révoqué (simulé par expiration) est refusé

  it('TC-LOGOUT-01 : Après "déconnexion", un token expiré est refusé', async () => {
    const expiredToken = generateExpiredToken(users.patient.id);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalide|expiré/i);
  });

  it('TC-LOGOUT-02 : Utilisateur peut se re-connecter après déconnexion simulée', async () => {
    // Simule une reconnexion
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testLoginEmail, mot_de_passe: testLoginPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
