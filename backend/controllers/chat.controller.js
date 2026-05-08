import pool from '../config/db.mysql.js';

// ─── Get or create conversation between two users ─────────
const getOrCreateConversation = async (user1_id, user2_id) => {
  const [min, max] = [Math.min(user1_id, user2_id), Math.max(user1_id, user2_id)];
  let [rows] = await pool.execute(
    'SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?',
    [min, max]
  );
  if (rows.length) return rows[0];

  const [result] = await pool.execute(
    'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
    [min, max]
  );
  const [conv] = await pool.execute('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
  return conv[0];
};

// ─── GET /api/chat/conversations ──────────────────────────
export const getConversations = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.execute(
      `SELECT
         c.*,
         u1.prenom AS u1_prenom, u1.nom AS u1_nom, u1.role AS u1_role, u1.photo_url AS u1_photo,
         u2.prenom AS u2_prenom, u2.nom AS u2_nom, u2.role AS u2_role, u2.photo_url AS u2_photo,
         (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.lu = 0 AND m.expediteur_id != ?) AS unread_count
       FROM conversations c
       JOIN utilisateurs u1 ON u1.id = c.user1_id
       JOIN utilisateurs u2 ON u2.id = c.user2_id
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_msg_at DESC`,
      [userId, userId, userId]
    );

    const conversations = rows.map(conv => {
      const other = conv.user1_id === userId
        ? { id: conv.user2_id, prenom: conv.u2_prenom, nom: conv.u2_nom, role: conv.u2_role, photo_url: conv.u2_photo }
        : { id: conv.user1_id, prenom: conv.u1_prenom, nom: conv.u1_nom, role: conv.u1_role, photo_url: conv.u1_photo };
      return { id: conv.id, other_user: other, dernier_message: conv.dernier_message,
               last_msg_at: conv.last_msg_at, unread_count: conv.unread_count };
    });

    res.json({ conversations });
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
    // Verify the other user exists and can be chatted with
    const [otherUser] = await pool.execute(
      'SELECT id, prenom, nom, role FROM utilisateurs WHERE id = ?',
      [otherId]
    );
    if (!otherUser.length) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const conv = await getOrCreateConversation(meId, otherId);

    let where  = 'WHERE m.conversation_id = ?';
    const params = [conv.id];
    if (before) {
      where += ' AND m.id < ?';
      params.push(before);
    }

    const [messages] = await pool.execute(
      `SELECT m.*, u.prenom, u.nom, u.photo_url
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       ${where}
       ORDER BY m.created_at DESC LIMIT ?`,
      [...params, parseInt(limit)]
    );

    // Mark messages from other user as read
    await pool.execute(
      'UPDATE messages SET lu = 1 WHERE conversation_id = ? AND expediteur_id = ? AND lu = 0',
      [conv.id, otherId]
    );

    res.json({ messages: messages.reverse(), conversation_id: conv.id, other_user: otherUser[0] });
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
    const conv = await getOrCreateConversation(expediteur_id, parseInt(destinataire_id));

    const [result] = await pool.execute(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conv.id, expediteur_id, contenu.trim()]
    );

    await pool.execute(
      'UPDATE conversations SET dernier_message = ?, last_msg_at = NOW() WHERE id = ?',
      [contenu.trim().substring(0, 100), conv.id]
    );

    const [msg] = await pool.execute(
      `SELECT m.*, u.prenom, u.nom, u.photo_url
       FROM messages m JOIN utilisateurs u ON u.id = m.expediteur_id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: msg[0] });
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
      // Doctor can chat with: their patients + secretaries
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        WHERE u.id != ? AND u.role IN ('patient','secretaire') AND u.actif = 1
        ORDER BY u.role, u.nom`;
      params = [id];
    } else if (role === 'patient') {
      // Patient can chat with: their doctors
      query = `
        SELECT DISTINCT u.id, u.prenom, u.nom, u.role, u.photo_url
        FROM utilisateurs u
        JOIN rendez_vous r ON (r.medecin_id = u.id OR r.medecin_id = u.id)
        WHERE r.patient_id = ? AND u.role = 'medecin' AND u.actif = 1
        ORDER BY u.nom`;
      params = [id];
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