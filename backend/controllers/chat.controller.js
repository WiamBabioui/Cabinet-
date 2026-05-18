import mongoose from 'mongoose';
import pool from '../config/db.mysql.js';
import { getSocket } from '../config/socket.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { createNotification } from './notification.controller.js';

const normalizeId = (value) => Number.parseInt(value, 10);

const normalizeParticipants = (user1, user2) => {
  const ids = [normalizeId(user1), normalizeId(user2)];
  if (ids.some(Number.isNaN)) return null;
  return ids.sort((a, b) => a - b);
};

const serializeMessage = async (message) => {
  const raw = message.toObject ? message.toObject() : message;
  const senderDetails = raw.senderDetails || await getUserDetails(raw.senderId);
  return {
    id: raw._id.toString(),
    _id: raw._id.toString(),
    conversationId: raw.conversationId.toString(),
    conversation_id: raw.conversationId.toString(),
    senderId: raw.senderId,
    receiverId: raw.receiverId,
    expediteur_id: raw.senderId,
    destinataire_id: raw.receiverId,
    content: raw.content,
    contenu: raw.content,
    message: raw.content,
    seen: !!raw.seen,
    lu: !!raw.seen,
    createdAt: raw.createdAt,
    created_at: raw.createdAt,
    updatedAt: raw.updatedAt,
    senderDetails
  };
};

const serializeConversation = async (conversation, userId) => {
  if (!Array.isArray(conversation.participants) || conversation.participants.length !== 2) {
    return null;
  }

  const otherUserId = conversation.participants.find((id) => id !== userId);
  const otherUser = await getUserDetails(otherUserId);
  if (!otherUser) return null;

  return {
    id: conversation._id.toString(),
    _id: conversation._id.toString(),
    participants: conversation.participants,
    other_user: otherUser,
    lastMessage: { text: conversation.lastMessage || '' },
    lastMessageText: conversation.lastMessage || '',
    updatedAt: conversation.lastMessageAt || conversation.updatedAt,
    unread_count: Number(conversation.unreadCounts?.get(String(userId)) || 0)
  };
};

export const getConversations = async (req, res) => {
  const userId = normalizeId(req.user.id);

  try {
    const conversations = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(50);

    const conversationsWithDetails = await Promise.all(
      conversations.map((conversation) => serializeConversation(conversation, userId))
    );

    res.json({ conversations: conversationsWithDetails.filter(Boolean) });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getMessages = async (req, res) => {
  const meId = normalizeId(req.user.id);
  const otherId = normalizeId(req.params.userId);
  const { before, limit = 50 } = req.query;

  if (Number.isNaN(otherId)) {
    return res.status(400).json({ message: 'Utilisateur invalide' });
  }

  try {
    const otherUser = await getUserDetails(otherId);
    if (!otherUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const conversation = await getOrCreateConversation(meId, otherId);
    const filter = { conversationId: conversation._id, deleted: { $ne: true } };

    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(normalizeId(limit) || 50, 100));

    await Message.updateMany(
      { conversationId: conversation._id, senderId: otherId, receiverId: meId, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { [`unreadCounts.${meId}`]: 0 } }
    );

    const serialized = await Promise.all(messages.reverse().map(serializeMessage));

    res.json({
      messages: serialized,
      conversation_id: conversation._id.toString(),
      conversationId: conversation._id.toString(),
      other_user: otherUser
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const sendMessage = async (req, res) => {
  const { destinataire_id, contenu, receiverId, content } = req.body;
  const senderId = normalizeId(req.user.id);
  const receiver = normalizeId(destinataire_id ?? receiverId);
  const text = String(contenu ?? content ?? '').trim();

  if (Number.isNaN(receiver)) return res.status(400).json({ message: 'Destinataire invalide' });
  if (!text) return res.status(400).json({ message: 'Message vide' });

  try {
    const receiverDetails = await getUserDetails(receiver);
    if (!receiverDetails) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const conversation = await getOrCreateConversation(senderId, receiver);
    const created = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId: receiver,
      content: text
    });

    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversation._id },
      {
        $set: { lastMessage: text.substring(0, 100), lastMessageAt: created.createdAt },
        $inc: { [`unreadCounts.${receiver}`]: 1 }
      },
      { new: true }
    );

    const newMessage = await serializeMessage(created);
    const receiverConversation = await serializeConversation(updatedConversation || conversation, receiver);
    const senderConversation = await serializeConversation(updatedConversation || conversation, senderId);

    getSocket().to(`conv_${conversation._id}`).emit('receive_message', newMessage);
    getSocket().to(`user_${receiver}`).emit('receive_message', newMessage);
    if (receiverConversation) getSocket().to(`user_${receiver}`).emit('conversation_updated', receiverConversation);
    if (senderConversation) getSocket().to(`user_${senderId}`).emit('conversation_updated', senderConversation);

    const senderDetails = newMessage.senderDetails || req.user;
    await createNotification(
      receiver,
      'message_new',
      'Nouveau message',
      `${senderDetails.prenom || ''} vous a envoye un message : ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      { conversation_id: conversation._id.toString(), expediteur_id: senderId }
    );

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getContacts = async (req, res) => {
  const { role, id } = req.user;
  const userRole = role?.toLowerCase().trim();

  try {
    let query;
    let params = [];

    if (userRole === 'medecin') {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, COALESCE(NULLIF(u.role, ''), 'patient') as role, u.photo_url
        FROM utilisateurs u
        WHERE u.id != ?
          AND (u.role = 'patient' OR u.role = 'secretaire' OR u.role = '' OR u.role IS NULL)
          AND u.actif = 1
          AND u.deleted_at IS NULL
        ORDER BY u.role, u.nom`;
      params = [id];
    } else if (userRole === 'patient' || !userRole) {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        WHERE (u.role = 'medecin' OR u.role = 'secretaire') 
          AND u.actif = 1 
          AND u.deleted_at IS NULL
        ORDER BY u.role, u.nom`;
    } else if (userRole === 'secretaire') {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, COALESCE(NULLIF(u.role, ''), 'patient') as role, u.photo_url
        FROM utilisateurs u
        WHERE u.id != ?
          AND (u.role = 'medecin' OR u.role = 'patient' OR u.role = '' OR u.role IS NULL)
          AND u.actif = 1
          AND u.deleted_at IS NULL
        ORDER BY u.role, u.nom`;
      params = [id];
    } else {
      return res.json({ contacts: [] });
    }

    const [contacts] = await pool.execute(query, params);
    res.json({ contacts });
  } catch (err) {
    console.error('getContacts error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

export const deleteMessage = async (req, res) => {
  const userId = normalizeId(req.user.id);
  const { messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: 'Message invalide' });
  }

  try {
    const message = await Message.findOne({ _id: messageId, deleted: { $ne: true } });
    if (!message) return res.status(404).json({ message: 'Message introuvable' });
    if (message.senderId !== userId) return res.status(403).json({ message: 'Non autorise' });

    message.deleted = true;
    await message.save();

    getSocket().to(`conv_${message.conversationId}`).emit('message_deleted', message._id.toString());

    res.json({ message: 'Message supprime avec succes' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getUserDetails = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, prenom, nom, COALESCE(NULLIF(role, ''), 'patient') as role, photo_url
     FROM utilisateurs
     WHERE id = ? AND actif = 1 AND deleted_at IS NULL`,
    [userId]
  );
  return rows[0] || null;
};

const getOrCreateConversation = async (user1, user2) => {
  const participants = normalizeParticipants(user1, user2);
  if (!participants) throw new Error('Invalid conversation participants');
  const participantKey = participants.join(':');

  let conversation = await Conversation.findOne({
    $or: [{ participantKey }, { participants: { $all: participants, $size: 2 } }]
  });

  if (conversation) {
    if (!conversation.participantKey) {
      conversation.participantKey = participantKey;
      await conversation.save();
    }
    return conversation;
  }

  try {
    return await Conversation.create({
      participants,
      participantKey,
      unreadCounts: { [participants[0]]: 0, [participants[1]]: 0 }
    });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Conversation.findOne({ participantKey });
      if (existing) return existing;
    }
    throw err;
  }
};
