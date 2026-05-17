import mongoose from 'mongoose';
import { getSocket } from '../config/socket.js';
import Notification from '../models/Notification.js';

const serializeNotification = (notification) => {
  const raw = notification.toObject ? notification.toObject() : notification;
  return {
    id: raw._id.toString(),
    _id: raw._id.toString(),
    userId: raw.userId,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    data: raw.data || {},
    isRead: !!raw.isRead,
    readAt: raw.readAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
};

export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      userId: Number(userId),
      type,
      title,
      message,
      data: data || {}
    });

    const serialized = serializeNotification(notification);

    // Emit real-time notification — gracefully skip if socket isn't ready yet
    try {
      getSocket().to(`user_${userId}`).emit('new_notification', serialized);
    } catch {
      // Socket not initialized yet (e.g. during startup) — notification still saved to DB
    }

    return serialized;
  } catch (err) {
    console.error('createNotification error:', err);
    return null;
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unread = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications: notifications.map(serializeNotification),
      unread
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(req.user.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Notification invalide' });
    }

    const result = await Notification.updateOne(
      { _id: id, userId },
      { $set: { isRead: true, readAt: new Date() } }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: 'Notification non trouvee ou non autorisee' });
    }

    res.json({ message: 'Notification marquee comme lue' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ message: 'Toutes les notifications marquees comme lues' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(req.user.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Notification invalide' });
    }

    const result = await Notification.deleteOne({ _id: id, userId });

    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Notification non trouvee ou non autorisee' });
    }

    res.json({ message: 'Notification supprimee' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createNotificationFromFrontend = async (req, res) => {
  try {
    const { type = 'info', title, message, data } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Titre et message requis' });
    }

    const notification = await createNotification(req.user.id, type, title, message, data);
    res.status(201).json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
