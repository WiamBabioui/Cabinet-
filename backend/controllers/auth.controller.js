import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.mysql.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// ─── INSCRIPTION ─────────────────────────────────────────────────────────────
export const signup = async (req, res) => {
  const {
    prenom, nom, email, mot_de_passe, role, telephone,
    specialite_id, num_ordre,
    assigned_doctor_id,
  } = req.body;

  const rolesAutorises = ['admin', 'medecin', 'secretaire', 'patient'];
  if (!rolesAutorises.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  if ((role === 'patient' || role === 'secretaire') && !assigned_doctor_id) {
    return res.status(400).json({
      message: `Un médecin assigné est requis pour le rôle ${role}`,
    });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    if (assigned_doctor_id) {
      const [doctorRows] = await pool.execute(
        `SELECT id FROM utilisateurs
         WHERE id = ? AND role = 'medecin' AND actif = 1 AND deleted_at IS NULL`,
        [Number(assigned_doctor_id)]
      );
      if (doctorRows.length === 0) {
        return res.status(400).json({
          message: 'Le médecin sélectionné est introuvable ou inactif',
        });
      }
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);

    const [result] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, telephone, assigned_doctor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hash,
        role,
        prenom,
        nom,
        telephone || null,
        assigned_doctor_id ? Number(assigned_doctor_id) : null,
      ]
    );

    const userId = result.insertId;

    if (role === 'medecin') {
      if (!specialite_id || !num_ordre) {
        return res.status(400).json({
          message: 'specialite_id et num_ordre requis pour un médecin',
        });
      }
      await pool.execute(
        `INSERT INTO medecins (utilisateur_id, specialite_id, num_ordre)
         VALUES (?, ?, ?)`,
        [userId, Number(specialite_id), num_ordre]
      );
    }

    const token = generateToken(userId);

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: userId,
        prenom,
        nom,
        email,
        role,
        assigned_doctor_id: assigned_doctor_id ? Number(assigned_doctor_id) : null,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};

// ─── CONNEXION ────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    const [rows] = await pool.execute(
      `SELECT id, uuid, email, mot_de_passe_hash, role, prenom, nom, actif,
              tentatives_connexion, bloque_jusqu_au, photo_url, assigned_doctor_id
       FROM utilisateurs WHERE email = ? AND deleted_at IS NULL`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];

    if (user.bloque_jusqu_au && new Date(user.bloque_jusqu_au) > new Date()) {
      return res.status(403).json({
        message: 'Compte temporairement bloqué. Réessayez plus tard.',
      });
    }

    if (!user.actif) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);

    if (!isMatch) {
      const tentatives = (user.tentatives_connexion || 0) + 1;
      const bloquer = tentatives >= 5
        ? new Date(Date.now() + 15 * 60 * 1000)
        : null;

      await pool.execute(
        'UPDATE utilisateurs SET tentatives_connexion = ?, bloque_jusqu_au = ? WHERE id = ?',
        [tentatives, bloquer, Number(user.id)]
      );
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    await pool.execute(
      'UPDATE utilisateurs SET tentatives_connexion = 0, bloque_jusqu_au = NULL, dernier_connexion = NOW() WHERE id = ?',
      [Number(user.id)]
    );

    // ✅ Notification de bienvenue — sans crasher le login
    try {
      await pool.execute(
        `INSERT INTO notifications (destinataire_id, type, titre, corps, donnees_contexte)
         VALUES (?, 'alerte_systeme', 'Connexion', ?, NULL)`,
        [Number(user.id), `Bienvenue, ${user.prenom} !`]
      );
    } catch (notifErr) {
      console.warn('Notification non-blocking error:', notifErr.message);
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        photo_url: user.photo_url || null,
        assigned_doctor_id: user.assigned_doctor_id || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

// ─── MON PROFIL ───────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.uuid, u.email, u.role, u.prenom, u.nom, u.telephone, u.photo_url,
              u.assigned_doctor_id,
              m.id as medecin_id, m.specialite_id, m.titre, m.consultation_tarif,
              s.libelle as specialite,
              ud.prenom as assigned_doctor_prenom,
              ud.nom as assigned_doctor_nom
       FROM utilisateurs u
       LEFT JOIN medecins m ON m.utilisateur_id = u.id
       LEFT JOIN specialites s ON s.id = m.specialite_id
       LEFT JOIN utilisateurs ud ON ud.id = u.assigned_doctor_id
       WHERE u.id = ?`,
      [Number(req.user.id)]
    );

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── CHANGER MOT DE PASSE ─────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  const { ancien_mdp, nouveau_mdp } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT mot_de_passe_hash FROM utilisateurs WHERE id = ?',
      [Number(req.user.id)]
    );

    const isMatch = await bcrypt.compare(ancien_mdp, rows[0].mot_de_passe_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    }

    const newHash = await bcrypt.hash(nouveau_mdp, 12);
    await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe_hash = ? WHERE id = ?',
      [newHash, Number(req.user.id)]
    );

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};