import pool from '../config/db.mysql.js';
import { getSocket } from '../config/socket.js';
import { createNotification } from './notification.controller.js';

// ─── Get all conversations for a user ───────────────────────────
export const getConversations = async (req, res) => {
  const userId = req.user.id;
  try {
    const [conversations] = await pool.execute(
      `SELECT c.id as _id, c.dernier_message as lastMessageText, c.last_msg_at as updatedAt,
              c.user1_id, c.user2_id
       FROM conversations c
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_msg_at DESC`,
      [userId, userId]
    );

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
        const otherUserDetails = await getUserDetails(otherUserId);

        const [unreadRows] = await pool.execute(
          'SELECT COUNT(*) as unread FROM messages WHERE conversation_id = ? AND expediteur_id != ? AND lu = 0',
          [conv._id, userId]
        );

        return {
          id: conv._id,
          other_user: otherUserDetails,
          lastMessage: { text: conv.lastMessageText },
          updatedAt: conv.updatedAt,
          unread_count: unreadRows[0].unread
        };
      })
    );

    res.json({ conversations: conversationsWithDetails });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── GET /api/chat/messages/:userId ───────────────────────
export const getMessages = async (req, res) => {
  const meId    = req.user.id;
  const otherId = parseInt(req.params.userId);
  const { before, limit = 50 } = req.query;

  try {
    const otherUser = await getUserDetails(otherId);
    if (!otherUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const conversation = await getOrCreateConversation(meId, otherId);

    let query = 'SELECT id as _id, contenu as message, expediteur_id as senderId, created_at as createdAt FROM messages WHERE conversation_id = ?';
    const params = [conversation.id];

    if (before) {
      query += ' AND created_at < ?';
      params.push(new Date(before));
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [messages] = await pool.execute(query, params);

    // Mark messages from other user as read
    await pool.execute(
      'UPDATE messages SET lu = 1 WHERE conversation_id = ? AND expediteur_id = ? AND lu = 0',
      [conversation.id, otherId]
    );

    const messagesWithSenderDetails = await Promise.all(messages.map(async (msg) => {
      const senderDetails = await getUserDetails(msg.senderId);
      return {
        ...msg,
        senderDetails: senderDetails
      };
    }));

    res.json({ 
      messages: messagesWithSenderDetails.reverse(), 
      conversation_id: conversation.id, 
      other_user: otherUser 
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── POST /api/chat/messages ──────────────────────────────
export const sendMessage = async (req, res) => {
  const { destinataire_id, contenu } = req.body;
  const expediteur_id = req.user.id;

  if (!contenu?.trim()) return res.status(400).json({ message: 'Message vide' });

  try {
    const conversation = await getOrCreateConversation(expediteur_id, parseInt(destinataire_id));

    const [result] = await pool.execute(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conversation.id, expediteur_id, contenu.trim()]
    );

    const messageId = result.insertId;

    await pool.execute(
      'UPDATE conversations SET dernier_message = ?, last_msg_at = NOW() WHERE id = ?',
      [contenu.trim(), conversation.id]
    );

    const senderDetails = await getUserDetails(expediteur_id);

    const newMessage = {
      _id: messageId,
      conversationId: conversation.id,
      senderId: expediteur_id,
      message: contenu.trim(),
      createdAt: new Date(),
      senderDetails
    };

    // Emit message via Socket.IO
    getSocket().to(`conv_${conversation.id}`).emit('receive_message', newMessage);

    // Notification pour le destinataire
    await createNotification(
      destinataire_id,
      'message_new',
      'Nouveau message',
      `${senderDetails.prenom} vous a envoyé un message : ${contenu.substring(0, 50)}...`,
      { conversation_id: conversation.id, expediteur_id }
    );

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── GET /api/chat/contacts ───────────────────────────────
export const getContacts = async (req, res) => {
  const { role, id } = req.user;
  try {
    let query;
    let params = [];

    if (role === 'medecin') {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        WHERE u.id != ? 
          AND (u.role = 'patient' OR u.role = 'secretaire')
          AND u.actif = 1
        ORDER BY u.role, u.nom`;
      params = [id];
    } else if (role === 'patient') {
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        WHERE u.role = 'medecin' AND u.actif = 1
        ORDER BY u.nom`;
      params = [];
    } else if (role === 'secretaire') {
      // Secretary can chat with: doctors
      query = `
        SELECT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        WHERE u.role = 'medecin' AND u.actif = 1
        ORDER BY u.nom`;
    } else {
      // Fallback for unknown roles
      return res.json({ contacts: [] });
    }

    const [contacts] = await pool.execute(query, params);
    res.json({ contacts });
  } catch (err) {
    console.error('❌ getContacts error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─── DELETE /api/chat/messages/:messageId ─────────────────
export const deleteMessage = async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [messageId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Message introuvable' });

    const message = rows[0];
    if (message.expediteur_id !== userId) return res.status(403).json({ message: 'Non autorisé' });

    await pool.execute('DELETE FROM messages WHERE id = ?', [messageId]);

    // Optional: update conversation's last message if needed
    // For simplicity, we just leave it for now or set to 'Message supprimé'
    
    res.json({ message: 'Message supprimé avec succès' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Helper Functions ──────────────────────────────────────
const getUserDetails = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, prenom, nom, role, photo_url FROM utilisateurs WHERE id = ?',
    [userId]
  );
  return rows[0];
};

const getOrCreateConversation = async (user1, user2) => {
  const [rows] = await pool.execute(
    'SELECT * FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
    [user1, user2, user2, user1]
  );

  if (rows.length > 0) return rows[0];

  const [result] = await pool.execute(
    'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
    [user1, user2]
  );

  return { id: result.insertId, user1_id: user1, user2_id: user2 };
};