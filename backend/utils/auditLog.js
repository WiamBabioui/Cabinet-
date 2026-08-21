import pool from '../config/db.mysql.js';

/**
 * Log sensitive administrative actions to the MySQL audit_log table.
 * Extracts IP and User-Agent from Express request if provided.
 */
export const logAudit = async (req, { action, entite, entite_id = null, anciennes_valeurs = null, nouvelles_valeurs = null }) => {
  try {
    const userId = req?.user?.id || null;
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    const oldStr = anciennes_valeurs ? JSON.stringify(anciennes_valeurs) : null;
    const newStr = nouvelles_valeurs ? JSON.stringify(nouvelles_valeurs) : null;

    await pool.execute(
      `INSERT INTO audit_log (utilisateur_id, action, entite, entite_id, anciennes_valeurs, nouvelles_valeurs, adresse_ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, entite, entite_id, oldStr, newStr, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};
