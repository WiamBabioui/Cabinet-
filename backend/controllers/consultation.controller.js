import pool from '../config/db.mysql.js';
import { createNotification } from './notification.controller.js';

// ─── List consultations ────────────────────────────────────
export const getConsultations = async (req, res) => {
  const { role, id } = req.user;
  const { patient_id, search } = req.query;

  try {
    let where  = 'WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      where += ' AND c.medecin_id = ?';
      params.push(id);
    } else if (role === 'patient') {
      where += ' AND c.patient_id = ?';
      params.push(id);
    } else if (patient_id) {
      where += ' AND c.patient_id = ?';
      params.push(patient_id);
    }

    if (search) {
      where += ' AND (c.diagnostic LIKE ? OR c.notes LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q);
    }

    const [rows] = await pool.execute(
      `SELECT c.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom, p.photo_url AS patient_photo,
              m.prenom AS medecin_prenom, m.nom  AS medecin_nom,
              ms.libelle AS specialite,
              COUNT(o.id) AS nb_ordonnances
       FROM consultations c
       JOIN utilisateurs p  ON p.id = c.patient_id
       JOIN utilisateurs m  ON m.id = c.medecin_id
       LEFT JOIN medecins  me ON me.utilisateur_id = m.id
       LEFT JOIN specialites ms ON ms.id = me.specialite_id
       LEFT JOIN ordonnances o  ON o.consultation_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.date_consultation DESC`,
      params
    );

    res.json({ consultations: rows });
  } catch (err) {
    console.error('getConsultations error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Single consultation with prescriptions ───────────────
export const getConsultationById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom, p.photo_url AS patient_photo,
              p.email AS patient_email, p.telephone AS patient_tel,
              m.prenom AS medecin_prenom, m.nom AS medecin_nom,
              ms.libelle AS specialite
       FROM consultations c
       JOIN utilisateurs p ON p.id = c.patient_id
       JOIN utilisateurs m ON m.id = c.medecin_id
       LEFT JOIN medecins  me ON me.utilisateur_id = m.id
       LEFT JOIN specialites ms ON ms.id = me.specialite_id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Consultation introuvable' });

    const consult = rows[0];
    const { role, id } = req.user;
    if (role === 'patient' && consult.patient_id !== id) return res.status(403).json({ message: 'Accès refusé' });
    if (role === 'medecin' && consult.medecin_id !== id) return res.status(403).json({ message: 'Accès refusé' });

    const [ordonnances] = await pool.execute(
      'SELECT * FROM ordonnances WHERE consultation_id = ? ORDER BY id',
      [consult.id]
    );

    res.json({ consultation: consult, ordonnances });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Create consultation (doctor only) ────────────────────
export const createConsultation = async (req, res) => {
  const {
    patient_id, rendez_vous_id = null,
    date_consultation, diagnostic, notes,
    tension, temperature, poids,
    ordonnances = []
  } = req.body;

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      const [result] = await conn.execute(
        `INSERT INTO consultations
           (patient_id, medecin_id, rendez_vous_id, date_consultation, diagnostic, notes, tension, temperature, poids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient_id, req.user.id, rendez_vous_id, date_consultation,
         diagnostic || null, notes || null, tension || null,
         temperature || null, poids || null]
      );
      const consultId = result.insertId;

      // Insert prescriptions
      for (const ord of ordonnances) {
        await conn.execute(
          'INSERT INTO ordonnances (consultation_id, medicament, posologie, duree, notes) VALUES (?, ?, ?, ?, ?)',
          [consultId, ord.medicament, ord.posologie, ord.duree || null, ord.notes || null]
        );
      }

      // Mark appointment as completed
      if (rendez_vous_id) {
        await conn.execute(
          "UPDATE rendez_vous SET statut = 'completed' WHERE id = ?",
          [rendez_vous_id]
        );
      }

      await conn.commit();

      // Notify patient
      await createNotification(patient_id, 'consultation_done',
        'Consultation terminée',
        'Les résultats de votre consultation sont maintenant disponibles.',
        { consultation_id: consultId }
      );

      res.status(201).json({ consultation_id: consultId, message: 'Consultation créée avec succès' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('createConsultation error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Update consultation ───────────────────────────────────
export const updateConsultation = async (req, res) => {
  const { id } = req.params;
  const { diagnostic, notes, tension, temperature, poids, ordonnances } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM consultations WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Consultation introuvable' });
    if (rows[0].medecin_id !== req.user.id) return res.status(403).json({ message: 'Accès refusé' });

    await pool.execute(
      `UPDATE consultations SET
         diagnostic  = COALESCE(?, diagnostic),
         notes       = COALESCE(?, notes),
         tension     = COALESCE(?, tension),
         temperature = COALESCE(?, temperature),
         poids       = COALESCE(?, poids)
       WHERE id = ?`,
      [diagnostic || null, notes || null, tension || null,
       temperature || null, poids || null, id]
    );

    if (ordonnances) {
      await pool.execute('DELETE FROM ordonnances WHERE consultation_id = ?', [id]);
      for (const ord of ordonnances) {
        await pool.execute(
          'INSERT INTO ordonnances (consultation_id, medicament, posologie, duree, notes) VALUES (?, ?, ?, ?, ?)',
          [id, ord.medicament, ord.posologie, ord.duree || null, ord.notes || null]
        );
      }
    }

    res.json({ message: 'Consultation mise à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};