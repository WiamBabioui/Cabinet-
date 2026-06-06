// backend/migrate.js
// Run: node migrate.js
// Adds assigned_doctor_id column + FK to utilisateurs table

import pool from './config/db.mysql.js';

const run = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Starting migration: 001_add_assigned_doctor');

    // ── Step 1: Add column if it doesn't already exist ────────────────────────
    const [cols] = await conn.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'utilisateurs'
        AND COLUMN_NAME = 'assigned_doctor_id'
    `);

    if (cols.length === 0) {
      await conn.execute(`
        ALTER TABLE utilisateurs
          ADD COLUMN assigned_doctor_id INT(10) UNSIGNED NULL DEFAULT NULL AFTER role
      `);
      console.log('  ✅ Column assigned_doctor_id added');
    } else {
      console.log('  ⏭  Column assigned_doctor_id already exists — skipping');
    }

    // ── Step 2: Add index if it doesn't already exist ─────────────────────────
    const [idxRows] = await conn.execute(`
      SELECT INDEX_NAME FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'utilisateurs'
        AND INDEX_NAME = 'idx_assigned_doctor'
    `);

    if (idxRows.length === 0) {
      await conn.execute(`
        ALTER TABLE utilisateurs
          ADD INDEX idx_assigned_doctor (assigned_doctor_id, role)
      `);
      console.log('  ✅ Index idx_assigned_doctor added');
    } else {
      console.log('  ⏭  Index idx_assigned_doctor already exists — skipping');
    }

    // ── Step 3: Add FK constraint if it doesn't already exist ────────────────
    const [fkRows] = await conn.execute(`
      SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'utilisateurs'
        AND CONSTRAINT_NAME = 'fk_assigned_doctor'
    `);

    if (fkRows.length === 0) {
      await conn.execute(`
        ALTER TABLE utilisateurs
          ADD CONSTRAINT fk_assigned_doctor
          FOREIGN KEY (assigned_doctor_id) REFERENCES utilisateurs(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('  ✅ Foreign key fk_assigned_doctor added');
    } else {
      console.log('  ⏭  FK fk_assigned_doctor already exists — skipping');
    }

    // ── Step 4: Report existing unassigned patients/secretaries ──────────────
    const [unassigned] = await conn.execute(`
      SELECT role, COUNT(*) as count
      FROM utilisateurs
      WHERE role IN ('patient', 'secretaire')
        AND assigned_doctor_id IS NULL
        AND deleted_at IS NULL
      GROUP BY role
    `);

    if (unassigned.length > 0) {
      console.log('\n  ⚠️  Existing users without assigned_doctor_id:');
      unassigned.forEach(r => console.log(`     - ${r.role}: ${r.count} users`));
      console.log('     → These users will see empty contact lists until assigned.');
      console.log('     → Use the admin Users panel to assign them.');
    } else {
      console.log('  ✅ All existing patients/secretaries are assigned');
    }

    console.log('\n✅ Migration 001 completed successfully\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
};

run();
