import pool from './config/db.mysql.js';

async function checkSubTables() {
  try {
    const [m] = await pool.execute('DESCRIBE medecins');
    const [p] = await pool.execute('DESCRIBE patients');
    console.log('MEDECINS:', JSON.stringify(m, null, 2));
    console.log('PATIENTS:', JSON.stringify(p, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSubTables();
