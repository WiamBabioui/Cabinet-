import pool from '../config/db.mysql.js';

async function checkUsers() {
  try {
    const [rows] = await pool.execute("SELECT id, email, role, actif, deleted_at, tentatives_connexion, bloque_jusqu_au FROM utilisateurs WHERE email LIKE '%@cypress-test.com'");
    console.log('Cypress users in DB:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err.message);
    process.exit(1);
  }
}

checkUsers();
