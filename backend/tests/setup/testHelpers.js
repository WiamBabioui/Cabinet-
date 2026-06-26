// backend/tests/setup/testHelpers.js
// Shared helpers: DB seeding, token generation, teardown

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../../config/db.mysql.js';
import connectMongo from '../../config/db.mongo.js';
import mongoose from 'mongoose';

// ─── Token generation ─────────────────────────────────────────────────────────

export const generateToken = (id, expiresIn = '1h') =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'cabinet_plus_test_secret_2024', { expiresIn });

export const generateExpiredToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'cabinet_plus_test_secret_2024', { expiresIn: '-1s' });

// ─── DB helpers ───────────────────────────────────────────────────────────────

const TEST_PREFIX = 'test_jest_';
const makeEmail = (name) => `${TEST_PREFIX}${name}_${Date.now()}@cabinet-test.com`;
const HASH = bcrypt.hashSync('Password123!', 10);

export let testUsers = {};

/**
 * Inserts all test users needed for the test suite.
 * Returns an object with { admin, medecin, secretaire, patient, medecin2, patient2 }
 */
export const seedTestUsers = async () => {
  // Insert medecin first (others reference it)
  const [docRes] = await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
     VALUES (?, ?, 'medecin', 'Test', 'Medecin', 1)`,
    [makeEmail('medecin'), HASH]
  );
  const medecinId = docRes.insertId;

  // Insert medecin record in medecins table (requires specialite_id)
  // Get first available specialite or insert one
  let specialiteId = 1;
  try {
    const [specRows] = await pool.execute('SELECT id FROM specialites LIMIT 1');
    if (specRows.length > 0) specialiteId = specRows[0].id;
  } catch (_) {}

  try {
    await pool.execute(
      `INSERT INTO medecins (utilisateur_id, specialite_id, num_ordre)
       VALUES (?, ?, ?)`,
      [medecinId, specialiteId, `TEST${medecinId}`]
    );
  } catch (_) {}

  // Second doctor (for cross-doctor tests)
  const [doc2Res] = await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
     VALUES (?, ?, 'medecin', 'Test2', 'Medecin2', 1)`,
    [makeEmail('medecin2'), HASH]
  );
  const medecin2Id = doc2Res.insertId;

  try {
    await pool.execute(
      `INSERT INTO medecins (utilisateur_id, specialite_id, num_ordre)
       VALUES (?, ?, ?)`,
      [medecin2Id, specialiteId, `TEST${medecin2Id}`]
    );
  } catch (_) {}

  // Admin
  const [adminRes] = await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
     VALUES (?, ?, 'admin', 'Test', 'Admin', 1)`,
    [makeEmail('admin'), HASH]
  );
  const adminId = adminRes.insertId;

  // Secrétaire assigned to medecin
  const [secRes] = await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
     VALUES (?, ?, 'secretaire', 'Test', 'Secretaire', 1, ?)`,
    [makeEmail('secretaire'), HASH, medecinId]
  );
  const secretaireId = secRes.insertId;

  // Patient assigned to medecin
  const [patRes] = await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
     VALUES (?, ?, 'patient', 'Test', 'Patient', 1, ?)`,
    [makeEmail('patient'), HASH, medecinId]
  );
  const patientId = patRes.insertId;

  // Patient assigned to medecin2
  const [pat2Res] = await pool.execute(
    `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
     VALUES (?, ?, 'patient', 'Test2', 'Patient2', 1, ?)`,
    [makeEmail('patient2'), HASH, medecin2Id]
  );
  const patient2Id = pat2Res.insertId;

  // Insert patient records in patients table (for appointment tests)
  try {
    const [patUserRow] = await pool.execute('SELECT email FROM utilisateurs WHERE id = ?', [patientId]);
    const email = patUserRow[0].email;
    const numDossier = `DOS-TEST-${patientId}`;
    const uuid = `test-uuid-${patientId}-9999`;
    await pool.execute(
      `INSERT INTO patients (email, prenom, nom, num_dossier, uuid, sexe)
       VALUES (?, 'Test', 'Patient', ?, ?, 'M')
       ON DUPLICATE KEY UPDATE email = VALUES(email)`,
      [email, numDossier, uuid]
    );
  } catch (_) {}

  testUsers = {
    admin: { id: adminId, role: 'admin', token: generateToken(adminId) },
    medecin: { id: medecinId, role: 'medecin', token: generateToken(medecinId) },
    medecin2: { id: medecin2Id, role: 'medecin', token: generateToken(medecin2Id) },
    secretaire: { id: secretaireId, role: 'secretaire', token: generateToken(secretaireId) },
    patient: { id: patientId, role: 'patient', token: generateToken(patientId) },
    patient2: { id: patient2Id, role: 'patient', token: generateToken(patient2Id) },
  };

  return testUsers;
};

/**
 * Cleans up all test users created by the test suite.
 */
export const cleanupTestUsers = async () => {
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  try {
    const [testUserRows] = await pool.execute(
      `SELECT id FROM utilisateurs WHERE email LIKE ?`,
      [`${TEST_PREFIX}%`]
    );
    const ids = testUserRows.map(u => u.id);

    if (ids.length > 0) {
      const idsPlaceholder = ids.map(() => '?').join(',');

      // Delete from medecins
      try {
        await pool.execute(`DELETE FROM medecins WHERE utilisateur_id IN (${idsPlaceholder})`, ids);
      } catch (_) {}
      
      // Delete from patients (by email matching utilisateurs email)
      try {
        await pool.execute(
          `DELETE p FROM patients p
           JOIN utilisateurs u ON p.email = u.email
           WHERE u.id IN (${idsPlaceholder})`,
          ids
        );
      } catch (_) {}

      // Delete from utilisateurs
      await pool.execute(`DELETE FROM utilisateurs WHERE id IN (${idsPlaceholder})`, ids);
    }
  } finally {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  }
};

/**
 * Connects to MongoDB and MySQL for integration tests.
 */
export const connectDatabases = async () => {
  await connectMongo();
};

/**
 * Closes all DB connections.
 */
export const closeDatabases = async () => {
  await pool.end();
  await mongoose.disconnect();
};
