import bcrypt from 'bcryptjs';
import pool from './config/db.mysql.js';

async function createUser() {
  try {
    const email = 'admin@test.com';
    const password = 'password123';
    const hash = await bcrypt.hash(password, 12);
    
    await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hash, 'medecin', 'Admin', 'Test', 1]
    );
    console.log('User created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating user:', err.message);
    process.exit(1);
  }
}

createUser();
