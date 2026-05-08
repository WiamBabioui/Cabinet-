import pool from '../config/db.mysql.js';

// ─── Helper: create notification (also used by other controllers) ──
export const createNotification = async (userId, type, titre, message, data = {}) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, type, titre, message, data_json) VALUES (?, ?, ?, ?, ?)',
      [userId, type, titre, message, JSON.stringify(data)]
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
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.lu).length;
    res.json({ notifications: rows, unread });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────
export const markAsRead = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET lu = 1 WHERE id = ? AND user_id = ?',
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
      'UPDATE notifications SET lu = 1 WHERE user_id = ?',
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
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};