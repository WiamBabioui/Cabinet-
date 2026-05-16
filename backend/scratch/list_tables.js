import pool from './config/db.mysql.js';

async function listTables() {
  try {
    const [rows] = await pool.execute('SHOW TABLES');
    console.log('TABLES IN DATABASE:');
    rows.forEach(row => {
      console.log(`- ${Object.values(row)[0]}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error listing tables:', err.message);
    process.exit(1);
  }
}

listTables();
