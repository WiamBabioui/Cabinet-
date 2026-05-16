import pool from '../config/db.mysql.js';
import { getSocket } from '../config/socket.js';

export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO notifications (destinataire_id, type, titre, corps, donnees_contexte)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, JSON.stringify(data)]
    );

    const notificationId = result.insertId;

    const newNotification = {
      _id: notificationId,
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date()
    };

    // Emit notification via Socket.IO
    getSocket().to(`user_${userId}`).emit('new_notification', newNotification);

    return newNotification;
  } catch (err) {
    console.error('❌ createNotification error:', err);
  }
};

// ─── GET /api/notifications ───────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔔 Fetching notifications for user ${userId}`);
    const [rows] = await pool.execute(
      `SELECT id as _id, type, titre as title, corps as message, lu as isRead, donnees_contexte as data, created_at as createdAt
       FROM notifications
       WHERE destinataire_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const notifications = rows.map(r => ({
      ...r,
      isRead: !!r.isRead,
      data: r.data ? (typeof r.data === 'string' ? JSON.parse(r.data) : r.data) : {}
    }));

    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as unread FROM notifications WHERE destinataire_id = ? AND lu = 0',
      [userId]
    );

    res.json({ notifications, unread: countRows[0].unread });
  } catch (err) {
    console.error('❌ getNotifications error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET lu = 1, lu_le = NOW() WHERE id = ? AND destinataire_id = ?',
      [id, userId]
    );

    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    console.error('❌ markAsRead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET lu = 1, lu_le = NOW() WHERE destinataire_id = ? AND lu = 0',
      [userId]
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    console.error('❌ markAllAsRead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── DELETE /api/notifications/:id ───────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND destinataire_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification non trouvée ou non autorisée' });
    }

    res.json({ message: 'Notification supprimée' });
  } catch (err) {
    console.error('❌ deleteNotification error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── POST /api/notifications/create (Frontend triggered) ──────
export const createNotificationFromFrontend = async (req, res) => {
  try {
    const { type, title, message, data } = req.body;
    const notification = await createNotification(req.user.id, type, title, message, data);
    res.status(201).json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};