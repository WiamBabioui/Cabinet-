import jwt    from 'jsonwebtoken';
import pool   from '../config/db.mysql.js';

// ─── Verify JWT + load user ────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Non autorisé — token manquant' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      `SELECT id, uuid, email, role, prenom, nom, telephone, photo_url, actif
       FROM utilisateurs WHERE id = ? AND deleted_at IS NULL`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }
    if (!rows[0].actif) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// ─── Role guard ────────────────────────────────────────────
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Accès refusé — rôle(s) requis : ${roles.join(', ')}`
    });
  }
  next();
};

// ─── Socket.io auth (used in server.js) ───────────────────
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token manquant'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows]  = await pool.execute(
      'SELECT id, prenom, nom, role, photo_url FROM utilisateurs WHERE id = ? AND actif = 1',
      [decoded.id]
    );
    if (rows.length === 0) return next(new Error('Utilisateur introuvable'));

    socket.user = rows[0];
    next();
  } catch {
    next(new Error('Token invalide'));
  }
};