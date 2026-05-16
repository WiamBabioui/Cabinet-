import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import pool from '../config/db.mysql.js'; // Keep for now for getContacts and fetching user details
import { io } from '../server.js';


// ─── Get or create conversation between two users ─────────
export const getConversations = async (req, res) => {
  const userId = req.user.id;
  try {
    const conversations = await Conversation.find({ participants: userId })
                                            .sort({ updatedAt: -1 });

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find((id) => id !== userId);
        const otherUserDetails = await getUserDetails(otherUserId);

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: userId,
          seen: false
        });

        return {
          id: conv._id,
          other_user: otherUserDetails,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          unread_count: unreadCount
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
    // Verify the other user exists
    const otherUser = await getUserDetails(otherId);
    if (!otherUser) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const conversation = await getOrCreateConversation(meId, otherId);

    const query = {
      conversationId: conversation._id,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
                                  .sort({ createdAt: -1 })
                                  .limit(parseInt(limit));

    // Mark messages from other user as read
    await Message.updateMany(
      { conversationId: conversation._id, senderId: otherId, receiverId: meId, seen: false },
      { $set: { seen: true } }
    );

    // Populate sender details for each message (assuming senderId is MySQL user ID)
    const messagesWithSenderDetails = await Promise.all(messages.map(async (msg) => {
      const senderDetails = await getUserDetails(msg.senderId);
      return {
        ...msg.toObject(),
        senderDetails: senderDetails
      };
    }));

    res.json({ messages: messagesWithSenderDetails.reverse(), conversation_id: conversation._id, other_user: otherUser });
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

    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: expediteur_id,
      receiverId: parseInt(destinataire_id),
      message: contenu.trim()
    });

    await newMessage.save();

    conversation.lastMessage = {
      text: newMessage.message,
      senderId: newMessage.senderId,
      createdAt: newMessage.createdAt
    };
    conversation.updatedAt = newMessage.createdAt;
    await conversation.save();

    // Emit message via Socket.IO
    io.to(`conv_${conversation._id.toString()}`).emit('receive_message', {
      ...newMessage.toObject(),
      senderDetails: senderDetails
    });

    const senderDetails = await getUserDetails(expediteur_id);

    // Notification pour le destinataire - this will be refactored later
    await createNotification(
      destinataire_id,
      'message_new',
      'Nouveau message',
      `${senderDetails.prenom} vous a envoyé un message : ${contenu.substring(0, 50)}...`,
      { conversation_id: conversation._id, expediteur_id }
    );

    res.status(201).json({ message: { ...newMessage.toObject(), senderDetails } });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── GET /api/chat/contacts ───────────────────────────────
export const getContacts = async (req, res) => {
  const { role, id, email } = req.user;
  try {
    let query;
    let params = [];

    if (role === 'medecin') {
      // Doctor can chat with: their patients + secretaries
      // A doctor's patients are those who have a rendez-vous with them
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        LEFT JOIN patients p ON p.email = u.email
        LEFT JOIN rendez_vous r ON r.patient_id = p.id
        LEFT JOIN medecins m ON m.id = r.medecin_id
        WHERE u.id != ? 
          AND (
            (u.role = 'patient' AND m.utilisateur_id = ?) 
            OR u.role = 'secretaire'
          )
          AND u.actif = 1
        ORDER BY u.role, u.nom`;
      params = [id, id];
    } else if (role === 'patient') {
      // Patient can chat with: their doctors
      // Find doctors linked via rendez-vous (matching patients.email with utilisateurs.email)
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        JOIN medecins m ON m.utilisateur_id = u.id
        JOIN rendez_vous r ON r.medecin_id = m.id
        JOIN patients p ON p.id = r.patient_id
        WHERE p.email = ? AND u.role = 'medecin' AND u.actif = 1
        ORDER BY u.nom`;
      params = [email];
    } else if (role === 'secretaire') {
      // Secretary can chat with: doctors
      query = `
        SELECT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        WHERE u.role = 'medecin' AND u.actif = 1
        ORDER BY u.nom`;
    }

    const [contacts] = await pool.execute(query, params);
    res.json({ contacts });
  } catch (err) {
    console.error('getContacts error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── DELETE /api/chat/messages/:messageId ─────────────────
export const deleteMessage = async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message introuvable' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce message' });
    }

    const conversationId = message.conversationId;
    await Message.deleteOne({ _id: messageId });

    // Update conversation's last message if it was the one deleted
    const conversation = await Conversation.findById(conversationId);

    if (conversation) {
      if (conversation.lastMessage && conversation.lastMessage._id.toString() === messageId) {
        // Find the new last message
        const lastMessage = await Message.findOne({ conversationId })
                                         .sort({ createdAt: -1 });

        if (lastMessage) {
          conversation.lastMessage = {
            text: lastMessage.message,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt
          };
        } else {
          conversation.lastMessage = null; // No messages left
        }
        await conversation.save();
      }
    }

    res.json({ message: 'Message supprimé avec succès' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};