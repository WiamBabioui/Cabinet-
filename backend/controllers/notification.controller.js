import pool from '../config/db.mysql.js';

// ─── Helper: create notification (also used by other controllers) ──
export const createNotification = async (destinataireId, type, titre, message, data = {}) => {
  // Mapping internal types to DB enums
  const typeMap = {
    'appointment_new':       'rappel_rdv',
    'appointment_confirmed': 'confirmation_rdv',
    'appointment_cancelled': 'annulation_rdv',
    'appointment_completed': 'alerte_systeme',
    'message_new':           'message_interne',
    'system_welcome':        'alerte_systeme'
  };

  const dbType = typeMap[type] || 'alerte_systeme';

  try {
    await pool.execute(
      'INSERT INTO notifications (destinataire_id, type, titre, corps, donnees_contexte) VALUES (?, ?, ?, ?, ?)',
      [destinataireId, dbType, titre, message, JSON.stringify(data)]
    );
  } catch (err) {
    console.error('createNotification error:', err);
  }
};

// ─── GET /api/notifications ───────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM notifications
       WHERE destinataire_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.lu).length;
    res.json({ notifications: rows, unread });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────
export const markAsRead = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET lu = 1, lu_le = NOW() WHERE id = ? AND destinataire_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification lue' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET lu = 1, lu_le = NOW() WHERE destinataire_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── DELETE /api/notifications/:id ───────────────────────
export const deleteNotification = async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND destinataire_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};