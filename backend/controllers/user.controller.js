import bcrypt from 'bcryptjs';
import pool from '../config/db.mysql.js';

// ✅ LISTE des utilisateurs (admin seulement)
export const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, uuid, email, role, prenom, nom, telephone, actif, created_at
       FROM utilisateurs
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ UN utilisateur par ID
export const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.uuid, u.email, u.role, u.prenom, u.nom, u.telephone,
              u.actif, u.created_at,
              m.id as medecin_id, m.specialite_id, m.titre,
              m.consultation_tarif, m.consultation_duree, m.disponible,
              s.libelle as specialite
       FROM utilisateurs u
       LEFT JOIN medecins m ON m.utilisateur_id = u.id
       LEFT JOIN specialites s ON s.id = m.specialite_id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ MODIFIER un utilisateur
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { prenom, nom, telephone, photo_url } = req.body;

  // Un utilisateur ne peut modifier que son propre profil (sauf admin)
  if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    await pool.execute(
      `UPDATE utilisateurs SET prenom = ?, nom = ?, telephone = ?, photo_url = ?
       WHERE id = ?`,
      [prenom, nom, telephone || null, photo_url || null, id]
    );

    res.json({ message: 'Profil mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ ACTIVER / DÉSACTIVER un utilisateur (admin seulement)
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      'SELECT actif FROM utilisateurs WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const newStatus = rows[0].actif ? 0 : 1;

    await pool.execute(
      'UPDATE utilisateurs SET actif = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      message: newStatus ? 'Utilisateur activé' : 'Utilisateur désactivé',
      actif: !!newStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ SUPPRIMER un utilisateur (soft delete, admin seulement)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === parseInt(id)) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
  }

  try {
    await pool.execute(
      'UPDATE utilisateurs SET deleted_at = NOW(), actif = 0 WHERE id = ?',
      [id]
    );

    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ LISTE des spécialités (pour le formulaire médecin)
export const getSpecialites = async (req, res) => {
  try {
    console.log('📋 Route specialites appelée !'); // ← ajoute ça
    const [specialites] = await pool.execute(
      'SELECT id, libelle, code FROM specialites ORDER BY libelle'
    );
    res.json({ specialites });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};