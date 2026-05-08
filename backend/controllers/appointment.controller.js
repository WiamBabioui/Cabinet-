import pool from '../config/db.mysql.js';
import { createNotification } from './notification.controller.js';

// ─── List appointments ─────────────────────────────────────
export const getAppointments = async (req, res) => {
  const { role, id } = req.user;
  const { date, statut, search } = req.query;

  try {
    let where  = 'WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      where += ' AND r.medecin_id = ?';
      params.push(id);
    } else if (role === 'patient') {
      where += ' AND r.patient_id = ?';
      params.push(id);
    }

    if (date) {
      where += ' AND DATE(r.date_heure) = ?';
      params.push(date);
    }
    if (statut) {
      where += ' AND r.statut = ?';
      params.push(statut);
    }
    if (search) {
      where += ` AND (
        CONCAT(p.prenom,' ',p.nom) LIKE ? OR
        CONCAT(m.prenom,' ',m.nom) LIKE ? OR
        r.type_rdv LIKE ? OR r.motif LIKE ?
      )`;
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    const [rows] = await pool.execute(
      `SELECT r.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom, p.photo_url AS patient_photo,
              m.prenom AS medecin_prenom, m.nom  AS medecin_nom,
              ms.libelle AS specialite
       FROM rendez_vous r
       JOIN utilisateurs p  ON p.id = r.patient_id
       JOIN utilisateurs m  ON m.id = r.medecin_id
       LEFT JOIN medecins  me ON me.utilisateur_id = m.id
       LEFT JOIN specialites ms ON ms.id = me.specialite_id
       ${where}
       ORDER BY r.date_heure DESC`,
      params
    );

    res.json({ appointments: rows });
  } catch (err) {
    console.error('getAppointments error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Single appointment ────────────────────────────────────
export const getAppointmentById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom, p.telephone AS patient_tel,
              p.photo_url AS patient_photo, p.email AS patient_email,
              m.prenom AS medecin_prenom, m.nom AS medecin_nom
       FROM rendez_vous r
       JOIN utilisateurs p ON p.id = r.patient_id
       JOIN utilisateurs m ON m.id = r.medecin_id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    const rdv = rows[0];

    // Access control
    const { role, id } = req.user;
    if (role === 'patient'  && rdv.patient_id !== id) return res.status(403).json({ message: 'Accès refusé' });
    if (role === 'medecin'  && rdv.medecin_id !== id) return res.status(403).json({ message: 'Accès refusé' });

    res.json({ appointment: rdv });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Create appointment ────────────────────────────────────
export const createAppointment = async (req, res) => {
  const { patient_id, medecin_id, date_heure, duree = 30, type_rdv = 'Consultation', motif, notes } = req.body;

  try {
    // Prevent overlapping for the same doctor
    const [overlap] = await pool.execute(
      `SELECT id FROM rendez_vous
       WHERE medecin_id = ?
         AND statut NOT IN ('cancelled')
         AND date_heure < DATE_ADD(?, INTERVAL ? MINUTE)
         AND DATE_ADD(date_heure, INTERVAL duree MINUTE) > ?`,
      [medecin_id, date_heure, duree, date_heure]
    );
    if (overlap.length > 0) {
      return res.status(409).json({ message: 'Créneau déjà occupé pour ce médecin' });
    }

    const [result] = await pool.execute(
      `INSERT INTO rendez_vous (patient_id, medecin_id, date_heure, duree, type_rdv, motif, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, medecin_id, date_heure, duree, type_rdv, motif || null, notes || null, req.user.id]
    );

    const apptId = result.insertId;

    // Notifications
    await createNotification(patient_id, 'appointment_new',
      'Nouveau rendez-vous', `Votre rendez-vous du ${new Date(date_heure).toLocaleDateString('fr-FR')} a été créé.`,
      { appointment_id: apptId }
    );
    await createNotification(medecin_id, 'appointment_new',
      'Nouveau rendez-vous', `Un rendez-vous a été planifié pour le ${new Date(date_heure).toLocaleDateString('fr-FR')}.`,
      { appointment_id: apptId }
    );

    const [rdv] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [apptId]);
    res.status(201).json({ appointment: rdv[0], message: 'Rendez-vous créé avec succès' });
  } catch (err) {
    console.error('createAppointment error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Update appointment ────────────────────────────────────
export const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { date_heure, duree, type_rdv, motif, notes, statut } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Rendez-vous introuvable' });

    const rdv  = rows[0];
    const role = req.user.role;

    // Role restrictions
    if (role === 'patient' && rdv.patient_id !== req.user.id)
      return res.status(403).json({ message: 'Accès refusé' });
    if (role === 'patient' && statut && statut !== 'cancelled')
      return res.status(403).json({ message: 'Un patient peut uniquement annuler' });
    if (role === 'medecin' && rdv.medecin_id !== req.user.id)
      return res.status(403).json({ message: 'Accès refusé' });

    await pool.execute(
      `UPDATE rendez_vous SET
         date_heure  = COALESCE(?, date_heure),
         duree       = COALESCE(?, duree),
         type_rdv    = COALESCE(?, type_rdv),
         motif       = COALESCE(?, motif),
         notes       = COALESCE(?, notes),
         statut      = COALESCE(?, statut),
         annule_par  = IF(? = 'cancelled', ?, annule_par)
       WHERE id = ?`,
      [date_heure || null, duree || null, type_rdv || null, motif || null, notes || null,
       statut || null, statut || null, req.user.id, id]
    );

    // Notify on status change
    if (statut && statut !== rdv.statut) {
      const typeMap = {
        confirmed:  'appointment_confirmed',
        cancelled:  'appointment_cancelled',
        completed:  'appointment_completed',
      };
      if (typeMap[statut]) {
        const label = { confirmed:'confirmé', cancelled:'annulé', completed:'terminé' }[statut];
        await createNotification(rdv.patient_id, typeMap[statut],
          `Rendez-vous ${label}`,
          `Votre rendez-vous a été ${label}.`,
          { appointment_id: id }
        );
      }
    }

    const [updated] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [id]);
    res.json({ appointment: updated[0], message: 'Rendez-vous mis à jour' });
  } catch (err) {
    console.error('updateAppointment error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Delete appointment ────────────────────────────────────
export const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Rendez-vous introuvable' });

    const rdv = rows[0];
    if (req.user.role === 'medecin' && rdv.medecin_id !== req.user.id)
      return res.status(403).json({ message: 'Accès refusé' });

    await pool.execute('DELETE FROM rendez_vous WHERE id = ?', [id]);
    res.json({ message: 'Rendez-vous supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Upcoming appointments (for dashboard) ────────────────
export const getUpcoming = async (req, res) => {
  const { role, id } = req.user;
  try {
    let where = "WHERE r.date_heure >= NOW() AND r.statut IN ('pending','confirmed')";
    const params = [];

    if (role === 'medecin') { where += ' AND r.medecin_id = ?'; params.push(id); }
    if (role === 'patient') { where += ' AND r.patient_id = ?'; params.push(id); }

    const [rows] = await pool.execute(
      `SELECT r.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom,
              m.prenom AS medecin_prenom, m.nom AS medecin_nom
       FROM rendez_vous r
       JOIN utilisateurs p ON p.id = r.patient_id
       JOIN utilisateurs m ON m.id = r.medecin_id
       ${where}
       ORDER BY r.date_heure ASC LIMIT 10`,
      params
    );
    res.json({ appointments: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Available slots for a doctor ─────────────────────────
export const getAvailableSlots = async (req, res) => {
  const { medecin_id, date } = req.query;
  if (!medecin_id || !date) return res.status(400).json({ message: 'medecin_id et date requis' });

  const slots = [];
  const start = 8, end = 18;
  for (let h = start; h < end; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }

  try {
    const [taken] = await pool.execute(
      `SELECT TIME_FORMAT(date_heure, '%H:%i') AS heure
       FROM rendez_vous
       WHERE medecin_id = ? AND DATE(date_heure) = ? AND statut != 'cancelled'`,
      [medecin_id, date]
    );
    const takenSet = new Set(taken.map(r => r.heure));
    const available = slots.filter(s => !takenSet.has(s));
    res.json({ slots: available });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};