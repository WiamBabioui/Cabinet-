import pool from './config/db.mysql.js';
import bcrypt from 'bcryptjs';
import runMigration from './migrations/002_rbac_permissions.js';

const seed = async () => {
  try {
    console.log('🔄 Starting admin seed...');

    // 1. Run migrations first to ensure tables exist
    await runMigration();

    const email = process.env.ADMIN_EMAIL || 'admin@cabinet.local';
    const password = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    // 2. Check if admin user exists
    const [existing] = await pool.execute(
      'SELECT id FROM utilisateurs WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (existing.length === 0) {
      const hash = await bcrypt.hash(password, 12);
      await pool.execute(
        `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, telephone, actif, email_verifie)
         VALUES (?, ?, 'admin', 'Admin', 'Systeme', '0600000000', 1, 1)`,
        [email, hash]
      );
      console.log(`  ✅ Initial Admin account created with email: ${email}`);
    } else {
      console.log(`  ⏭  Admin account with email: ${email} already exists`);
    }

    console.log('✅ Admin seeding completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
    process.exit(1);
  }
};

seed();
