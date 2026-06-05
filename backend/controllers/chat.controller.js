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
  const parts = conversation.participants;
  if (!Array.isArray(parts) || parts.length < 2) return null;

  // Explicit Number coercion ensures === works regardless of BSON/JS type
  const userIdNum = Number(userId);
  if (isNaN(userIdNum)) return null;

  const otherUserId = parts.find((id) => Number(id) !== userIdNum);
  if (otherUserId == null) return null;

  const otherUser = await getUserDetails(Number(otherUserId));
  if (!otherUser) return null;

  const lastMsgAt = conversation.lastMessageAt || conversation.updatedAt;

  return {
    id: conversation._id.toString(),
    _id: conversation._id.toString(),
    participants: parts.map(Number),
    other_user: otherUser,
    lastMessage: { text: conversation.lastMessage || '' },
    lastMessageText: conversation.lastMessage || '',
    updatedAt: lastMsgAt,
    lastMessageAt: lastMsgAt,
    unread_count: Number(conversation.unreadCounts?.get(String(userIdNum)) ?? 0),
  };
};

export const getConversations = async (req, res) => {
  const userId = normalizeId(req.user.id);
  const userRole = req.user.role?.toLowerCase().trim();
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Utilisateur invalide' });
  }

  try {
    const conversations = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(50);

    console.log(`[chat] getConversations: userId=${userId}, raw=${conversations.length}`);

    const conversationsWithDetails = await Promise.all(
      conversations.map((conv) => serializeConversation(conv, userId))
    );

    let filtered = conversationsWithDetails.filter(Boolean);

    // Patients must only chat with medecin/secretaire — remove patient-to-patient convs
    if (userRole === 'patient') {
      filtered = filtered.filter((conv) => {
        const otherRole = conv.other_user?.role?.toLowerCase().trim();
        return otherRole === 'medecin' || otherRole === 'secretaire';
      });
    }

    console.log(`[chat] getConversations: serialized=${filtered.length}`);

    res.json({ conversations: filtered });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }
};


export const getMessages = async (req, res) => {
  const meId = normalizeId(req.user.id);
  const otherId = normalizeId(req.params.userId);
  const { before, limit = 50 } = req.query;

  if (Number.isNaN(otherId)) {
    return res.status(400).json({ message: 'Utilisateur invalide' });
  }
  if (Number.isNaN(meId)) {
    return res.status(400).json({ message: 'Utilisateur authentifié invalide' });
  }

  try {
    const otherUser = await getUserDetails(otherId);
    if (!otherUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const conversation = await getOrCreateConversation(meId, otherId);
    const filter = { conversationId: conversation._id, deleted: { $ne: true } };

    if (before) filter.createdAt = { $lt: new Date(before) };

    const limitNum = Math.min(normalizeId(limit) || 50, 100);
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum);

    // Mark received messages as seen
    await Message.updateMany(
      { conversationId: conversation._id, senderId: otherId, receiverId: meId, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );
    // Reset unread count for the current user
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { [`unreadCounts.${meId}`]: 0 } }
    );

    const serialized = await Promise.all(messages.reverse().map(serializeMessage));

    res.json({
      messages: serialized,
      conversation_id: conversation._id.toString(),
      conversationId: conversation._id.toString(),
      other_user: otherUser,
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }
};

export const sendMessage = async (req, res) => {
  const { destinataire_id, contenu, receiverId, content } = req.body;
  const senderId = normalizeId(req.user.id);
  const receiver = normalizeId(destinataire_id ?? receiverId);
  const text = String(contenu ?? content ?? '').trim();
  const senderRole = req.user.role?.toLowerCase().trim();

  if (Number.isNaN(receiver)) return res.status(400).json({ message: 'Destinataire invalide' });
  if (!text) return res.status(400).json({ message: 'Message vide' });

  try {
    const receiverDetails = await getUserDetails(receiver);
    if (!receiverDetails) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Patients cannot send messages to other patients
    const receiverRole = receiverDetails.role?.toLowerCase().trim();
    if (senderRole === 'patient' && receiverRole === 'patient') {
      return res.status(403).json({ message: 'Les patients ne peuvent pas se contacter entre eux' });
    }

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
  const userId = normalizeId(id);

  try {
    let query;
    let params = [];

    // Correction : Utilisation de backticks `role` car c'est un mot réservé MySQL 8
    if (userRole === 'medecin') {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, COALESCE(NULLIF(u.role, ''), 'patient') as \`role\`, u.photo_url
        FROM utilisateurs u
        WHERE u.id != ?
          AND (u.role = 'patient' OR u.role = 'secretaire' OR u.role = '' OR u.role IS NULL)
          AND u.actif = 1
          AND u.deleted_at IS NULL
        ORDER BY \`role\`, u.nom`;
      params = [userId];
    } else if (userRole === 'patient' || !userRole) {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role as \`role\`, u.photo_url
        FROM utilisateurs u
        WHERE (u.role = 'medecin' OR u.role = 'secretaire') 
          AND u.actif = 1 
          AND u.deleted_at IS NULL
        ORDER BY \`role\`, u.nom`;
        params = [];
    } else if (userRole === 'secretaire') {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, COALESCE(NULLIF(u.role, ''), 'patient') as \`role\`, u.photo_url
        FROM utilisateurs u
        WHERE u.id != ?
          AND (u.role = 'medecin' OR u.role = 'patient' OR u.role = '' OR u.role IS NULL)
          AND u.actif = 1
          AND u.deleted_at IS NULL
        ORDER BY \`role\`, u.nom`;
      params = [userId];
    } else {
      return res.json({ contacts: [] });
    }

    const [contacts] = await pool.query(query, params);
    res.json({ contacts });
  } catch (err) {
    console.error('getContacts error:', err);
    // On renvoie l'erreur détaillée pour aider au debug
    res.status(500).json({ message: 'Erreur serveur contacts', error: err.message });
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
  try {
    const [rows] = await pool.query(
      `SELECT id, prenom, nom, COALESCE(NULLIF(role, ''), 'patient') as \`role\`, photo_url
       FROM utilisateurs
       WHERE id = ? AND actif = 1 AND deleted_at IS NULL`,
      [normalizeId(userId)]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("getUserDetails error:", err.message);
    return null;
  }
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