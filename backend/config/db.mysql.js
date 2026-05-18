import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connecté');
    conn.release();
  })
  .catch(err => console.error('❌ MySQL erreur:', err.message));

export default pool;