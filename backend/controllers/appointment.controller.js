import pool from '../config/db.mysql.js';

// ─── Helper: Map Statuses ──────────────────────────────────
const mapStatusToDb = (status) => {
  const map = {
    'pending':   'planifie',
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
    'termine':  'completed',
    'annule':   'cancelled',
  };
  return map[status] || 'pending';
};

// ─── Helper: notification sans crasher ────────────────────
const safeNotify = async (userId, type, titre, corps, contexte = null) => {
  const validTypes = [
    'rappel_rdv', 'confirmation_rdv', 'annulation_rdv',
    'nouveau_document', 'paiement_recu', 'alerte_systeme', 'message_interne'
  ];
  const safeType = validTypes.includes(type) ? type : 'alerte_systeme';
  try {
    await pool.execute(
      `INSERT INTO notifications (destinataire_id, type, titre, corps, donnees_contexte)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Number(userId),
        safeType,
        titre,
        corps,
        contexte ? JSON.stringify(contexte) : null
      ]
    );
  } catch (err) {
    console.warn('Notification non-blocking error:', err.message);
  }
};

// ─── Helper: format date LOCAL ─────────────────────────────
const toLocalSQLString = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// ─── List appointments ─────────────────────────────────────
export const getAppointments = async (req, res) => {
  const { role, id } = req.user;
  const { date, statut, search } = req.query;

  try {
    let where = 'WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      where += ' AND m.utilisateur_id = ?';
      params.push(Number(id));
    } else if (role === 'secretaire') {
      // Secrétaire voit les RDV du médecin assigné
      const [userRows] = await pool.execute(
        'SELECT assigned_doctor_id FROM utilisateurs WHERE id = ?',
        [Number(id)]
      );
      const doctorId = userRows[0]?.assigned_doctor_id;
      if (doctorId) {
        where += ' AND m.utilisateur_id = ?';
        params.push(Number(doctorId));
      }
    } else if (role === 'patient') {
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
              u_m.prenom AS medecin_prenom, u_m.nom AS medecin_nom
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
      [Number(req.params.id)]
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
  const {
    patient_email,
    medecin_id: bodyMedecinId,
    date_heure,
    duree = 30,
    type_rdv = 'suivi',
    motif,
    notes
  } = req.body;

  try {
    // 1. Trouver utilisateur_id du médecin
    let utilisateur_id = bodyMedecinId;
    if (!utilisateur_id && req.user.role === 'medecin') {
      utilisateur_id = req.user.id;
    }
    if (!utilisateur_id) {
      return res.status(400).json({ message: 'medecin_id est requis' });
    }

    const [medecinRows] = await pool.execute(
      'SELECT id FROM medecins WHERE utilisateur_id = ?',
      [Number(utilisateur_id)]
    );
    if (medecinRows.length === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    const mid = medecinRows[0].id;

    // 2. Trouver patient par email
    if (!patient_email) {
      return res.status(400).json({ message: 'Email du patient requis' });
    }
    const [patientRows] = await pool.execute(
      'SELECT id FROM patients WHERE email = ? AND deleted_at IS NULL',
      [patient_email]
    );
    if (patientRows.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé avec cet email' });
    }
    const patient_id = patientRows[0].id;

    // 3. Calculer date_heure_fin
    const parsedDuree = parseInt(duree) || 30;
    const startDate = new Date(date_heure);
    const endDate = new Date(startDate.getTime() + parsedDuree * 60000);
    const date_heure_debut = toLocalSQLString(startDate);
    const date_heure_fin = toLocalSQLString(endDate);

    // 4. Vérifier chevauchement
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

    // 5. Créer le RDV
    const [result] = await pool.execute(
      `INSERT INTO rendez_vous
        (patient_id, medecin_id, secretaire_id, date_heure_debut, date_heure_fin,
         type_consultation, motif, notes, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        mid,
        req.user.role === 'secretaire' ? Number(req.user.id) : null,
        date_heure_debut,
        date_heure_fin,
        type_rdv || 'suivi',
        motif || 'Consultation',
        notes || null,
        'planifie'
      ]
    );

    const apptId = result.insertId;

    // 6. Notification
    await safeNotify(
      req.user.id,
      'rappel_rdv',
      'Nouveau rendez-vous',
      `Rendez-vous créé pour le ${startDate.toLocaleDateString('fr-FR')}`,
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
    const [rows] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [Number(id)]);
    if (!rows.length) return res.status(404).json({ message: 'Rendez-vous introuvable' });

    const rdv = rows[0];
    const dbStatut = statut ? mapStatusToDb(statut) : null;

    let date_heure_fin = rdv.date_heure_fin;
    if (date_heure || duree) {
      const start = new Date(date_heure || rdv.date_heure_debut);
      const d = parseInt(duree) || 30;
      const end = new Date(start.getTime() + d * 60000);
      date_heure_fin = toLocalSQLString(end);
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
      [
        date_heure || null,
        date_heure_fin || null,
        type_rdv || null,
        motif || null,
        notes || null,
        dbStatut || null,
        Number(id)
      ]
    );

    // Notification changement statut
    if (dbStatut && dbStatut !== rdv.statut) {
      const notifType = {
        confirme: 'confirmation_rdv',
        annule:   'annulation_rdv',
        termine:  'alerte_systeme',
      }[dbStatut] || 'alerte_systeme';

      const label = {
        confirme: 'confirmé',
        annule:   'annulé',
        termine:  'terminé'
      }[dbStatut] || 'mis à jour';

      await safeNotify(
        req.user.id,
        notifType,
        `Rendez-vous ${label}`,
        `Votre rendez-vous a été ${label}.`,
        { appointment_id: id }
      );
    }

    const [updated] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [Number(id)]);
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
    const [rows] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [Number(id)]);
    if (!rows.length) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    await pool.execute('DELETE FROM rendez_vous WHERE id = ?', [Number(id)]);
    res.json({ message: 'Rendez-vous supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Upcoming appointments ─────────────────────────────────
export const getUpcoming = async (req, res) => {
  const { role, id } = req.user;
  try {
    let where = "WHERE r.date_heure_debut >= NOW() AND r.statut IN ('planifie','confirme')";
    const params = [];

    if (role === 'medecin') {
      where += ' AND m.utilisateur_id = ?';
      params.push(Number(id));
    } else if (role === 'secretaire') {
      const [userRows] = await pool.execute(
        'SELECT assigned_doctor_id FROM utilisateurs WHERE id = ?',
        [Number(id)]
      );
      const doctorId = userRows[0]?.assigned_doctor_id;
      if (doctorId) {
        where += ' AND m.utilisateur_id = ?';
        params.push(Number(doctorId));
      }
    } else if (role === 'patient') {
      where += ' AND p.email = ?';
      params.push(req.user.email);
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

// ─── Available slots ───────────────────────────────────────
export const getAvailableSlots = async (req, res) => {
  const { medecin_id: utilisateur_id, date } = req.query;
  if (!utilisateur_id || !date) {
    return res.status(400).json({ message: 'medecin_id et date requis' });
  }

  try {
    const [medecinRows] = await pool.execute(
      'SELECT id FROM medecins WHERE utilisateur_id = ?',
      [Number(utilisateur_id)]
    );
    if (medecinRows.length === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    const mid = medecinRows[0].id;

    const slots = [];
    for (let h = 8; h < 18; h++) {
      for (const m of [0, 30]) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
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