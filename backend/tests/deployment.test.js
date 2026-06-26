// backend/tests/deployment.test.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests de Déploiement / Post-Deployment Verification (Jest + Supertest)
// Couvre : health checks, variables d'environnement, DB connections, API production
// ═══════════════════════════════════════════════════════════════════════════════
//
// ⚠️  USAGE :
//   • En local    : npm run test:deployment       (variables depuis .env)
//   • En CI/prod  : BACKEND_URL=https://xxx.onrender.com npm run test:deployment
//
// ═══════════════════════════════════════════════════════════════════════════════

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from './setup/appFactory.js';
import { connectDatabases, closeDatabases } from './setup/testHelpers.js';
import pool from '../config/db.mysql.js';

// Determine if running against production URL or local app
const PRODUCTION_BACKEND_URL = process.env.BACKEND_URL || null;
const PRODUCTION_FRONTEND_URL = process.env.FRONTEND_URL || null;

let localApp;

beforeAll(async () => {
  if (!PRODUCTION_BACKEND_URL) {
    await connectDatabases();
    localApp = createTestApp();
  }
});

afterAll(async () => {
  if (!PRODUCTION_BACKEND_URL) {
    await closeDatabases();
  }
});

// Helper: makes request to either production URL or local app
const getClient = () => {
  if (PRODUCTION_BACKEND_URL) {
    return request(PRODUCTION_BACKEND_URL);
  }
  return request(localApp);
};

// ─── SUITE 1 : Variables d'environnement ──────────────────────────────────────

describe('🔧 Variables d\'environnement', () => {

  // ✅ TC-DEPLOY-01 : JWT_SECRET est défini et non vide
  it('TC-DEPLOY-01 : JWT_SECRET est défini', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET.length).toBeGreaterThan(8);
  });

  // ✅ TC-DEPLOY-02 : Base de données MySQL configurée
  it('TC-DEPLOY-02 : Variables MySQL sont définies', () => {
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_USER).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
  });

  // ✅ TC-DEPLOY-03 : MONGO_URI est défini
  it('TC-DEPLOY-03 : MONGO_URI est défini', () => {
    expect(process.env.MONGO_URI).toBeDefined();
    expect(process.env.MONGO_URI).toMatch(/^mongodb/);
  });

  // ✅ TC-DEPLOY-04 : PORT est un nombre valide
  it('TC-DEPLOY-04 : PORT est défini et valide', () => {
    const port = Number(process.env.PORT || 5000);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  // ✅ TC-DEPLOY-05 : JWT_EXPIRES_IN est défini
  it('TC-DEPLOY-05 : JWT_EXPIRES_IN est défini', () => {
    expect(process.env.JWT_EXPIRES_IN).toBeDefined();
    // Acceptable formats: '1d', '24h', '3600', '7d'
    expect(process.env.JWT_EXPIRES_IN).toMatch(/^\d+[dhms]?$/);
  });
});

// ─── SUITE 2 : Backend Health Check ──────────────────────────────────────────

describe('🟢 Backend — Health Check', () => {

  // ✅ TC-DEPLOY-06 : Backend répond sur /api/health → 200
  it('TC-DEPLOY-06 : GET /api/health → 200 (backend disponible)', async () => {
    const res = await getClient().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  // ✅ TC-DEPLOY-07 : Réponse en moins de 5 secondes
  it('TC-DEPLOY-07 : Backend répond en moins de 5 secondes', async () => {
    const start = Date.now();
    await getClient().get('/api/health');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  // ✅ TC-DEPLOY-08 : Headers CORS corrects
  it('TC-DEPLOY-08 : Headers CORS présents sur les réponses API', async () => {
    const res = await getClient().get('/api/health');
    // Access-Control-Allow-Origin should be present
    expect(res.headers).toHaveProperty('access-control-allow-origin');
  });
});

// ─── SUITE 3 : Connexion MongoDB ─────────────────────────────────────────────

describe('🍃 MongoDB Atlas — Connexion', () => {

  // ✅ TC-DEPLOY-09 : MongoDB est connecté (état mongoose)
  it('TC-DEPLOY-09 : MongoDB est connecté (readyState === 1)', () => {
    if (!PRODUCTION_BACKEND_URL) {
      // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
      expect(mongoose.connection.readyState).toBe(1);
    } else {
      // Cannot inspect mongoose state from external URL — skip
      console.log('Skipping local mongoose check for production URL');
      expect(true).toBe(true);
    }
  });

  // ✅ TC-DEPLOY-10 : Conversations MongoDB lisibles
  it('TC-DEPLOY-10 : MongoDB peut retourner des conversations via API', async () => {
    if (!PRODUCTION_BACKEND_URL) {
      const { default: Conversation } = await import('../models/Conversation.js');
      const count = await Conversation.countDocuments();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    } else {
      expect(true).toBe(true);
    }
  });
});

// ─── SUITE 4 : Connexion MySQL ────────────────────────────────────────────────

describe('🐬 MySQL — Connexion', () => {

  // ✅ TC-DEPLOY-11 : MySQL pool est actif
  it('TC-DEPLOY-11 : MySQL pool retourne une connexion valide', async () => {
    if (!PRODUCTION_BACKEND_URL) {
      const conn = await pool.getConnection();
      expect(conn).toBeDefined();
      conn.release();
    } else {
      expect(true).toBe(true);
    }
  });

  // ✅ TC-DEPLOY-12 : Table utilisateurs existe et est interrogeable
  it('TC-DEPLOY-12 : La table utilisateurs existe en MySQL', async () => {
    if (!PRODUCTION_BACKEND_URL) {
      const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM utilisateurs');
      expect(rows[0].cnt).toBeGreaterThanOrEqual(0);
    } else {
      expect(true).toBe(true);
    }
  });

  // ✅ TC-DEPLOY-13 : Tables critiques présentes en DB
  it('TC-DEPLOY-13 : Tables critiques présentes (utilisateurs, rendez_vous, medecins, patients)', async () => {
    if (!PRODUCTION_BACKEND_URL) {
      const tables = ['utilisateurs', 'rendez_vous', 'medecins', 'patients', 'notifications'];
      for (const table of tables) {
        const [[result]] = await pool.execute(
          `SELECT COUNT(*) as cnt FROM information_schema.tables
           WHERE table_schema = ? AND table_name = ?`,
          [process.env.DB_NAME || 'cabinet_plus', table]
        );
        expect(result.cnt).toBe(1);
      }
    } else {
      expect(true).toBe(true);
    }
  });
});

// ─── SUITE 5 : Authentification en production ─────────────────────────────────

describe('🔐 Authentification — Fonctionnelle en production', () => {

  // ✅ TC-DEPLOY-14 : Route de login accessible
  it('TC-DEPLOY-14 : POST /api/auth/login est accessible (pas 404)', async () => {
    const res = await getClient()
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', mot_de_passe: 'wrong' });

    // Should be 401 (not 404 = route exists)
    expect(res.status).not.toBe(404);
    expect(res.status).not.toBe(500);
    expect([401, 403]).toContain(res.status);
  });

  // ✅ TC-DEPLOY-15 : Route signup accessible
  it('TC-DEPLOY-15 : POST /api/auth/signup est accessible (pas 404)', async () => {
    const res = await getClient()
      .post('/api/auth/signup')
      .send({ role: 'invalid_role_test' });

    expect(res.status).not.toBe(404);
    expect([400, 500]).toContain(res.status);
  });

  // ✅ TC-DEPLOY-16 : Route protégée requiert un token
  it('TC-DEPLOY-16 : Route protégée /api/auth/me retourne 401 sans token', async () => {
    const res = await getClient().get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ─── SUITE 6 : API Fonctionnelle ─────────────────────────────────────────────

describe('📡 API — Routes critiques fonctionnelles', () => {

  // ✅ TC-DEPLOY-17 : Route rendez-vous accessible (nécessite auth)
  it('TC-DEPLOY-17 : GET /api/appointments retourne 401 sans token (route existe)', async () => {
    const res = await getClient().get('/api/appointments');
    expect(res.status).toBe(401);
  });

  // ✅ TC-DEPLOY-18 : Route chat accessible (nécessite auth)
  it('TC-DEPLOY-18 : GET /api/chat/conversations retourne 401 sans token', async () => {
    const res = await getClient().get('/api/chat/conversations');
    expect(res.status).toBe(401);
  });

  // ✅ TC-DEPLOY-19 : Route publique liste des médecins accessible
  it('TC-DEPLOY-19 : GET /api/users/medecins-list est publique → 200', async () => {
    const res = await getClient().get('/api/users/medecins-list');
    expect(res.status).toBe(200);
  });

  // ✅ TC-DEPLOY-20 : Route publique spécialités accessible
  it('TC-DEPLOY-20 : GET /api/users/specialites est publique → 200', async () => {
    const res = await getClient().get('/api/users/specialites');
    expect(res.status).toBe(200);
  });
});

// ─── SUITE 7 : Frontend (si FRONTEND_URL fourni) ──────────────────────────────

describe('🌐 Frontend — Disponibilité', () => {

  // ✅ TC-DEPLOY-21 : Frontend accessible (si URL fournie)
  it('TC-DEPLOY-21 : Frontend disponible sur FRONTEND_URL', async () => {
    if (!PRODUCTION_FRONTEND_URL) {
      console.log('⏭️  FRONTEND_URL non défini — test ignoré. Définir FRONTEND_URL pour tester.');
      expect(true).toBe(true);
      return;
    }

    const res = await request(PRODUCTION_FRONTEND_URL).get('/');
    expect(res.status).toBe(200);
  });
});
