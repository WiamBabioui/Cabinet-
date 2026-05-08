import pool from './config/db.mysql.js';

async function checkDB() {
  try {
    const [rows] = await pool.execute('SHOW TABLES');
    console.log('Tables in database:', rows.map(r => Object.values(r)[0]));
    
    const [columns] = await pool.execute('DESCRIBE utilisateurs');
    console.log('Columns in utilisateurs:', columns.map(c => c.Field));
    
    const [users] = await pool.execute('SELECT email, role FROM utilisateurs');
    console.log('Users in database:', users);
    
    process.exit(0);
  } catch (err) {
    console.error('Database check failed:', err.message);
    process.exit(1);
  }
}

checkDB();
