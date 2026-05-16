import Notification from '../models/Notification.js';
import { io } from '../server.js'; // Re-import io for real-time notifications
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const newNotification = new Notification({
      userId,
      type,
      title,
      message,
      metadata: data // Assuming 'data' can be stored in a 'metadata' field in the schema
    });
    await newNotification.save();

    // Emit notification via Socket.IO
    io.to(`user_${userId}`).emit('new_notification', newNotification);

    return newNotification;
  } catch (err) {
    console.error('createNotification error:', err);
  }
};

// ─── GET /api/notifications ───────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
                                            .sort({ createdAt: -1 })
                                            .limit(50);
    const unread = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ notifications, unread });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée ou non autorisée' });
    }

    res.json({ message: 'Notification marquée comme lue', notification });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── DELETE /api/notifications/:id ───────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await Notification.deleteOne({ _id: id, userId: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Notification non trouvée ou non autorisée' });
    }

    res.json({ message: 'Notification supprimée' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};