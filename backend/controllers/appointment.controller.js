import pool from '../config/db.mysql.js';
import { createNotification } from './notification.controller.js';

// ─── Helper: Map Statuses ──────────────────────────────────
const mapStatusToDb = (status) => {
  const map = {
    'pending': 'planifie',
    'confirmed': 'confirme',
    'completed': 'termine',
    'cancelled': 'annule',
  };
  return map[status] || 'planifie';
};

const mapStatusToClient = (status) => {
  const map = {
    'planifie': 'pending',
    'confirme': 'confirmed',
    'termine': 'completed',
    'annule': 'cancelled',
  };
  return map[status] || 'pending';
};

// ─── List appointments ─────────────────────────────────────
export const getAppointments = async (req, res) => {
  const { role, id } = req.user;
  const { date, statut, search } = req.query;

  try {
    let where  = 'WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      where += ' AND m.utilisateur_id = ?';
      params.push(id);
    } else if (role === 'patient') {
      // Patients table might not link to utilisateurs.id directly
      // This part might need adjustment if patients use the app
      where += ' AND p.email = ?';
      params.push(req.user.email);
    }

    if (date) {
      where += ' AND DATE(r.date_heure_debut) = ?';
      params.push(date);
    }
    if (statut) {
      where += ' AND r.statut = ?';
      params.push(mapStatusToDb(statut));
    }
    if (search) {
      where += ` AND (
        p.nom LIKE ? OR p.prenom LIKE ? OR
        u_m.prenom LIKE ? OR u_m.nom LIKE ? OR
        r.type_consultation LIKE ? OR r.motif LIKE ?
      )`;
      const q = `%${search}%`;
      params.push(q, q, q, q, q, q);
    }

    const [rows] = await pool.execute(
      `SELECT r.*,
              r.date_heure_debut AS date_heure,
              p.prenom AS patient_prenom, p.nom AS patient_nom,
              u_m.prenom AS medecin_prenom, u_m.nom  AS medecin_nom
       FROM rendez_vous r
       JOIN patients p  ON p.id = r.patient_id
       JOIN medecins m  ON m.id = r.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       ${where}
       ORDER BY r.date_heure_debut DESC`,
      params
    );

    const appointments = rows.map(r => ({
      ...r,
      statut: mapStatusToClient(r.statut),
      type_rdv: r.type_consultation
    }));

    res.json({ appointments });
  } catch (err) {
    console.error('getAppointments error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};

// ─── Single appointment ────────────────────────────────────
export const getAppointmentById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*,
              r.date_heure_debut AS date_heure,
              p.prenom AS patient_prenom, p.nom AS patient_nom, p.telephone AS patient_tel,
              p.email AS patient_email,
              u_m.prenom AS medecin_prenom, u_m.nom AS medecin_nom
       FROM rendez_vous r
       JOIN patients p ON p.id = r.patient_id
       JOIN medecins m ON m.id = r.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    const rdv = rows[0];

    res.json({ 
      appointment: {
        ...rdv,
        statut: mapStatusToClient(rdv.statut),
        type_rdv: rdv.type_consultation
      } 
    });
  } catch (err) {
    console.error('getAppointmentById error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Create appointment ────────────────────────────────────
export const createAppointment = async (req, res) => {
  const { patient_email, medecin_id: bodyMedecinId, date_heure, duree = 30, type_rdv = 'suivi', motif, notes } = req.body;

  try {
    // 1. Find medecin_id (the PK in 'medecins' table)
    let utilisateur_id = bodyMedecinId;
    if (!utilisateur_id && req.user.role === 'medecin') {
      utilisateur_id = req.user.id;
    }

    if (!utilisateur_id) return res.status(400).json({ message: 'medecin_id est requis' });

    const [medecinRows] = await pool.execute('SELECT id FROM medecins WHERE utilisateur_id = ?', [utilisateur_id]);
    if (medecinRows.length === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    const mid = medecinRows[0].id;

    // 2. Find patient_id (the PK in 'patients' table)
    const [patientRows] = await pool.execute('SELECT id FROM patients WHERE email = ? AND deleted_at IS NULL', [patient_email]);
    if (patientRows.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé avec cet email' });
    }
    const patient_id = patientRows[0].id;

    // 3. Calculate date_heure_fin
    const parsedDuree = parseInt(duree) || 30;
    const startDate = new Date(date_heure);
    const endDate = new Date(startDate.getTime() + parsedDuree * 60000);
    const date_heure_fin = endDate.toISOString().slice(0, 19).replace('T', ' ');
    const date_heure_debut = startDate.toISOString().slice(0, 19).replace('T', ' ');

    // 4. Prevent overlapping
    const [overlap] = await pool.execute(
      `SELECT id FROM rendez_vous
       WHERE medecin_id = ?
         AND statut NOT IN ('annule')
         AND date_heure_debut < ?
         AND date_heure_fin > ?`,
      [mid, date_heure_fin, date_heure_debut]
    );
    if (overlap.length > 0) {
      return res.status(409).json({ message: 'Créneau déjà occupé pour ce médecin' });
    }

    // 5. Create appointment
    const [result] = await pool.execute(
      `INSERT INTO rendez_vous (patient_id, medecin_id, secretaire_id, date_heure_debut, date_heure_fin, type_consultation, motif, notes, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        mid,
        req.user.role === 'secretaire' ? req.user.id : null,
        date_heure_debut,
        date_heure_fin,
        type_rdv || 'suivi',
        motif || 'Consultation',
        notes || null,
        'planifie'
      ]
    );

    const apptId = result.insertId;

    // 6. Notifications
    await createNotification(req.user.id, 'appointment_new',
      'Nouveau rendez-vous', `Le rendez-vous du ${new Date(date_heure).toLocaleDateString('fr-FR')} a été créé.`,
      { appointment_id: apptId }
    );

    const [rdv] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [apptId]);
    res.status(201).json({ 
      appointment: {
        ...rdv[0],
        date_heure: rdv[0].date_heure_debut,
        statut: 'pending'
      }, 
      message: 'Rendez-vous créé avec succès' 
    });
  } catch (err) {
    console.error('createAppointment error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la création du rendez-vous' });
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
    const dbStatut = statut ? mapStatusToDb(statut) : null;

    let date_heure_fin = rdv.date_heure_fin;
    if (date_heure || duree) {
      const start = new Date(date_heure || rdv.date_heure_debut);
      const d = parseInt(duree) || 30;
      const end = new Date(start.getTime() + d * 60000);
      date_heure_fin = end.toISOString().slice(0, 19).replace('T', ' ');
    }

    await pool.execute(
      `UPDATE rendez_vous SET
         date_heure_debut  = COALESCE(?, date_heure_debut),
         date_heure_fin    = COALESCE(?, date_heure_fin),
         type_consultation = COALESCE(?, type_consultation),
         motif             = COALESCE(?, motif),
         notes             = COALESCE(?, notes),
         statut            = COALESCE(?, statut)
       WHERE id = ?`,
      [date_heure || null, date_heure_fin || null, type_rdv || null, motif || null, notes || null,
       dbStatut || null, id]
    );

    // Notify on status change
    if (dbStatut && dbStatut !== rdv.statut) {
      const typeMap = {
        confirme:  'appointment_confirmed',
        annule:  'appointment_cancelled',
        termine:  'appointment_completed',
      };
      if (typeMap[dbStatut]) {
        const label = { confirme:'confirmé', annule:'annulé', termine:'terminé' }[dbStatut];
        await createNotification(req.user.id, typeMap[dbStatut],
          `Rendez-vous ${label}`,
          `Votre rendez-vous a été ${label}.`,
          { appointment_id: id }
        );
      }
    }

    const [updated] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [id]);
    res.json({ 
      appointment: {
        ...updated[0],
        date_heure: updated[0].date_heure_debut,
        statut: mapStatusToClient(updated[0].statut)
      }, 
      message: 'Rendez-vous mis à jour' 
    });
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
    let where = "WHERE r.date_heure_debut >= NOW() AND r.statut IN ('planifie','confirme')";
    const params = [];

    if (role === 'medecin') { 
      where += ' AND m.utilisateur_id = ?'; 
      params.push(id); 
    }

    const [rows] = await pool.execute(
      `SELECT r.*,
              r.date_heure_debut AS date_heure,
              p.prenom AS patient_prenom, p.nom AS patient_nom,
              u_m.prenom AS medecin_prenom, u_m.nom AS medecin_nom
       FROM rendez_vous r
       JOIN patients p ON p.id = r.patient_id
       JOIN medecins m ON m.id = r.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       ${where}
       ORDER BY r.date_heure_debut ASC LIMIT 10`,
      params
    );
    
    const appointments = rows.map(r => ({
      ...r,
      statut: mapStatusToClient(r.statut),
      type_rdv: r.type_consultation
    }));

    res.json({ appointments });
  } catch (err) {
    console.error('getUpcoming error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Available slots for a doctor ─────────────────────────
export const getAvailableSlots = async (req, res) => {
  const { medecin_id: utilisateur_id, date } = req.query;
  if (!utilisateur_id || !date) return res.status(400).json({ message: 'medecin_id et date requis' });

  try {
    const [medecinRows] = await pool.execute('SELECT id FROM medecins WHERE utilisateur_id = ?', [utilisateur_id]);
    if (medecinRows.length === 0) return res.status(404).json({ message: 'Médecin non trouvé' });
    const mid = medecinRows[0].id;

    const slots = [];
    const start = 8, end = 18;
    for (let h = start; h < end; h++) {
      for (const m of [0, 30]) {
        slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      }
    }

    const [taken] = await pool.execute(
      `SELECT TIME_FORMAT(date_heure_debut, '%H:%i') AS heure
       FROM rendez_vous
       WHERE medecin_id = ? AND DATE(date_heure_debut) = ? AND statut != 'annule'`,
      [mid, date]
    );
    const takenSet = new Set(taken.map(r => r.heure));
    const available = slots.filter(s => !takenSet.has(s));
    res.json({ slots: available });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};