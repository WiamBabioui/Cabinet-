import jwt from 'jsonwebtoken';
import pool from '../config/db.mysql.js';

// ✅ Vérifie le token JWT
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Non autorisé — token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis MySQL
    const [rows] = await pool.execute(
      'SELECT id, uuid, email, role, prenom, nom, actif FROM utilisateurs WHERE id = ? AND deleted_at IS NULL',
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

// ✅ Vérifie le rôle de l'utilisateur
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé — rôle requis: ${roles.join(', ')}`
      });
    }
    next();
  };
};