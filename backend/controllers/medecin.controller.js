import pool from '../config/db.mysql.js';

// ✅ GET profil médecin connecté
export const getMonProfil = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.prenom, u.nom, u.email, u.telephone, u.photo_url,
              m.id as medecin_id, m.specialite_id, m.num_ordre, m.titre,
              m.biographie, m.consultation_duree, m.consultation_tarif, m.disponible,
              s.libelle as specialite
       FROM utilisateurs u
       JOIN medecins m ON m.utilisateur_id = u.id
       JOIN specialites s ON s.id = m.specialite_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil médecin introuvable' });
    }

    res.json({ medecin: rows[0] });
  } catch (err) {
    console.error('getMonProfil error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ UPDATE profil médecin connecté
export const updateMonProfil = async (req, res) => {
  const {
    prenom, nom, telephone, photo_url,
    biographie, consultation_duree, consultation_tarif, disponible, titre
  } = req.body;

  try {
    await pool.execute(
      'UPDATE utilisateurs SET prenom=?, nom=?, telephone=?, photo_url=? WHERE id=?',
      [prenom, nom, telephone || null, photo_url || null, req.user.id]
    );

    const [med] = await pool.execute(
      'SELECT id FROM medecins WHERE utilisateur_id=?',
      [req.user.id]
    );

    if (med.length > 0) {
      await pool.execute(
        `UPDATE medecins SET titre=?, biographie=?, consultation_duree=?,
         consultation_tarif=?, disponible=? WHERE utilisateur_id=?`,
        [
          titre || 'Dr', biographie || null,
          consultation_duree || 30, consultation_tarif || 0,
          disponible !== undefined ? disponible : 1,
          req.user.id
        ]
      );
    }

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (err) {
    console.error('updateMonProfil error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ GET horaires du médecin connecté
export const getMesHoraires = async (req, res) => {
  try {
    const [med] = await pool.execute(
      'SELECT id FROM medecins WHERE utilisateur_id=?',
      [req.user.id]
    );

    if (med.length === 0) {
      return res.status(404).json({ message: 'Médecin introuvable' });
    }

    const [horaires] = await pool.execute(
      'SELECT * FROM horaires_medecin WHERE medecin_id=? ORDER BY jour_semaine',
      [med[0].id]
    );

    res.json({ horaires });
  } catch (err) {
    console.error('getMesHoraires error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ SAVE horaires (remplace tout)
export const saveMesHoraires = async (req, res) => {
  const { horaires } = req.body;

  try {
    const [med] = await pool.execute(
      'SELECT id FROM medecins WHERE utilisateur_id=?',
      [req.user.id]
    );

    if (med.length === 0) {
      return res.status(404).json({ message: 'Médecin introuvable' });
    }

    const medecinId = med[0].id;

    // Supprimer tous les anciens horaires
    await pool.execute(
      'DELETE FROM horaires_medecin WHERE medecin_id=?',
      [medecinId]
    );

    // Insérer les nouveaux
    for (const h of horaires) {
      if (h.actif) {
        await pool.execute(
          `INSERT INTO horaires_medecin (medecin_id, jour_semaine, heure_debut, heure_fin, actif)
           VALUES (?, ?, ?, ?, 1)`,
          [medecinId, h.jour_semaine, h.heure_debut, h.heure_fin]
        );
      }
    }

    res.json({ message: 'Horaires enregistrés avec succès' });
  } catch (err) {
    console.error('saveMesHoraires error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ GET liste de tous les médecins
export const getMedecins = async (req, res) => {
  try {
    const [medecins] = await pool.execute(
      `SELECT u.id, u.prenom, u.nom, u.email, u.telephone,
              m.id as medecin_id, m.titre, m.consultation_tarif,
              m.consultation_duree, m.disponible,
              s.libelle as specialite
       FROM utilisateurs u
       JOIN medecins m ON m.utilisateur_id = u.id
       JOIN specialites s ON s.id = m.specialite_id
       WHERE u.deleted_at IS NULL AND u.actif = 1
       ORDER BY u.nom`
    );

    res.json({ medecins });
  } catch (err) {
    console.error('getMedecins error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};