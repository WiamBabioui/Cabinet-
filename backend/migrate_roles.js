import pool from './config/db.mysql.js';

async function migrate() {
  try {
    await pool.execute("ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('admin', 'medecin', 'secretaire', 'patient') NOT NULL");
    console.log('✅ Role enum updated to include patient');
    
    // Update users with empty roles
    await pool.execute("UPDATE utilisateurs SET role = 'patient' WHERE role = ''");
    console.log('✅ Updated users with empty roles to patient');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
