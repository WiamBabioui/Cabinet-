// backend/tests/hierarchy.test.js
// Run with: node backend/tests/hierarchy.test.js

import pool from '../config/db.mysql.js';
import { canCommunicate } from '../middleware/hierarchy.middleware.js';

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
};

const runTests = async () => {
  console.log('🧪 Starting role hierarchy tests...');

  // ─── Setup Test Users ──────────────────────────────────────────────────────
  // We insert test users with special emails so we can easily delete them later
  const testPrefix = 'test_hierarchy_';
  const makeEmail = (name) => `${testPrefix}${name}@example.com`;

  try {
    // Clean up any stale test data first
    await pool.execute('DELETE FROM utilisateurs WHERE email LIKE ?', [`${testPrefix}%`]);

    // Insert Doctors
    const [docARes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, 'hash', 'medecin', 'Doctor', 'A', 1)`,
      [makeEmail('doc_a')]
    );
    const docAId = docARes.insertId;

    const [docBRes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, 'hash', 'medecin', 'Doctor', 'B', 1)`,
      [makeEmail('doc_b')]
    );
    const docBId = docBRes.insertId;

    // Insert Patients
    const [patA1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'patient', 'Patient', 'A1', 1, ?)`,
      [makeEmail('pat_a1'), docAId]
    );
    const patA1Id = patA1Res.insertId;

    const [patB1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'patient', 'Patient', 'B1', 1, ?)`,
      [makeEmail('pat_b1'), docBId]
    );
    const patB1Id = patB1Res.insertId;

    // Insert Secretaries
    const [secA1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'secretaire', 'Secretary', 'A1', 1, ?)`,
      [makeEmail('sec_a1'), docAId]
    );
    const secA1Id = secA1Res.insertId;

    const [secB1Res] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, assigned_doctor_id)
       VALUES (?, 'hash', 'secretaire', 'Secretary', 'B1', 1, ?)`,
      [makeEmail('sec_b1'), docBId]
    );
    const secB1Id = secB1Res.insertId;

    // Insert Admin
    const [adminRes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, 'hash', 'admin', 'Admin', 'User', 1)`,
      [makeEmail('admin')]
    );
    const adminId = adminRes.insertId;

    console.log('Test users seeded successfully.');

    // ─── Test Suite ──────────────────────────────────────────────────────────

    // Doctor A ↔ Patient A1 (Assigned) -> TRUE
    assert(
      (await canCommunicate(docAId, patA1Id)) === true,
      'Doctor A should be allowed to communicate with Patient A1 (assigned)'
    );
    assert(
      (await canCommunicate(patA1Id, docAId)) === true,
      'Patient A1 should be allowed to communicate with Doctor A (assigned)'
    );

    // Doctor A ↔ Patient B1 (Unassigned) -> FALSE
    assert(
      (await canCommunicate(docAId, patB1Id)) === false,
      'Doctor A should NOT be allowed to communicate with Patient B1 (unassigned)'
    );

    // Doctor A ↔ Secretary A1 (Assigned) -> TRUE
    assert(
      (await canCommunicate(docAId, secA1Id)) === true,
      'Doctor A should be allowed to communicate with Secretary A1 (assigned)'
    );

    // Doctor A ↔ Secretary B1 (Unassigned) -> FALSE
    assert(
      (await canCommunicate(docAId, secB1Id)) === false,
      'Doctor A should NOT be allowed to communicate with Secretary B1 (unassigned)'
    );

    // Patient A1 ↔ Secretary A1 (Same Doctor) -> TRUE
    assert(
      (await canCommunicate(patA1Id, secA1Id)) === true,
      'Patient A1 should be allowed to communicate with Secretary A1 (same doctor)'
    );

    // Patient A1 ↔ Secretary B1 (Different Doctor) -> FALSE
    assert(
      (await canCommunicate(patA1Id, secB1Id)) === false,
      'Patient A1 should NOT be allowed to communicate with Secretary B1 (different doctor)'
    );

    // Same role communications -> FALSE
    assert(
      (await canCommunicate(docAId, docBId)) === false,
      'Doctor A should NOT be allowed to communicate with Doctor B'
    );
    assert(
      (await canCommunicate(patA1Id, patB1Id)) === false,
      'Patient A1 should NOT be allowed to communicate with Patient B1'
    );
    assert(
      (await canCommunicate(secA1Id, secB1Id)) === false,
      'Secretary A1 should NOT be allowed to communicate with Secretary B1'
    );

    // Admin communications -> FALSE
    assert(
      (await canCommunicate(adminId, docAId)) === false,
      'Admin should NOT be allowed to communicate with Doctor A'
    );
    assert(
      (await canCommunicate(docAId, adminId)) === false,
      'Doctor A should NOT be allowed to communicate with Admin'
    );

    // Clean up
    await pool.execute('DELETE FROM utilisateurs WHERE email LIKE ?', [`${testPrefix}%`]);
    console.log('\n✨ All tests passed! Seeding cleaned up successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    // Try to cleanup in case of error
    try {
      await pool.execute("DELETE FROM utilisateurs WHERE email LIKE 'test_hierarchy_%'");
    } catch (_) {}
    process.exit(1);
  }
};

runTests();
