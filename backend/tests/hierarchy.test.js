// backend/tests/hierarchy.test.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Hiérarchie de Rôles (Jest)
// ═══════════════════════════════════════════════════════════════════════════════

import pool from '../config/db.mysql.js';
import { canCommunicate } from '../middleware/hierarchy.middleware.js';

describe('Role Hierarchy and Communication Permission Rules', () => {
  const testPrefix = 'test_hierarchy_';
  const makeEmail = (name) => `${testPrefix}${name}@example.com`;

  let docAId, docBId;
  let patA1Id, patB1Id;
  let secA1Id, secB1Id;
  let adminId;

  beforeAll(async () => {
    // Clean up any stale test data first
    await pool.execute('DELETE FROM utilisateurs WHERE email LIKE ?', [`${testPrefix}%`]);

    // Insert Doctors
    const [docARes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, 'hash', 'medecin', 'Doctor', 'A', 1)`,
      [makeEmail('doc_a')]
    );
    docAId = docARes.insertId;

    const [docBRes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, 'hash', 'medecin', 'Doctor', 'B', 1)`,
      [makeEmail('doc_b')]
    );
    docBId = docBRes.insertId;

    // Insert Patients
    const [patA1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'patient', 'Patient', 'A1', 1, ?)`,
      [makeEmail('pat_a1'), docAId]
    );
    patA1Id = patA1Res.insertId;

    const [patB1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'patient', 'Patient', 'B1', 1, ?)`,
      [makeEmail('pat_b1'), docBId]
    );
    patB1Id = patB1Res.insertId;

    // Insert Secretaries
    const [secA1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'secretaire', 'Secretary', 'A1', 1, ?)`,
      [makeEmail('sec_a1'), docAId]
    );
    secA1Id = secA1Res.insertId;

    const [secB1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'secretaire', 'Secretary', 'B1', 1, ?)`,
      [makeEmail('sec_b1'), docBId]
    );
    secB1Id = secB1Res.insertId;

    // Insert Admin
    const [adminRes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, 'hash', 'admin', 'Admin', 'User', 1)`,
      [makeEmail('admin')]
    );
    adminId = adminRes.insertId;
  });

  afterAll(async () => {
    await pool.execute('DELETE FROM utilisateurs WHERE email LIKE ?', [`${testPrefix}%`]);
  });

  test('Doctor and assigned patient should be allowed to communicate', async () => {
    expect(await canCommunicate(docAId, patA1Id)).toBe(true);
    expect(await canCommunicate(patA1Id, docAId)).toBe(true);
  });

  test('Doctor and unassigned patient should NOT be allowed to communicate', async () => {
    expect(await canCommunicate(docAId, patB1Id)).toBe(false);
  });

  test('Doctor and assigned secretary should be allowed to communicate', async () => {
    expect(await canCommunicate(docAId, secA1Id)).toBe(true);
  });

  test('Doctor and unassigned secretary should NOT be allowed to communicate', async () => {
    expect(await canCommunicate(docAId, secB1Id)).toBe(false);
  });

  test('Patient and secretary of the same doctor should be allowed to communicate', async () => {
    expect(await canCommunicate(patA1Id, secA1Id)).toBe(true);
  });

  test('Patient and secretary of different doctors should NOT be allowed to communicate', async () => {
    expect(await canCommunicate(patA1Id, secB1Id)).toBe(false);
  });

  test('Same-role communication should be disallowed', async () => {
    expect(await canCommunicate(docAId, docBId)).toBe(false);
    expect(await canCommunicate(patA1Id, patB1Id)).toBe(false);
    expect(await canCommunicate(secA1Id, secB1Id)).toBe(false);
  });

  test('Admin should be excluded from chat communications', async () => {
    expect(await canCommunicate(adminId, docAId)).toBe(false);
    expect(await canCommunicate(docAId, adminId)).toBe(false);
  });
});
