import pool from '../config/db.mysql.js';

// ─── List consultations ────────────────────────────────────
export const getConsultations = async (req, res) => {
  const { role, id } = req.user;
  const { patient_id, search } = req.query;

  try {
    let where  = 'WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      where += ' AND c.medecin_id = (SELECT id FROM medecins WHERE utilisateur_id = ?)';
      params.push(id);
    } else if (role === 'patient') {
      where += ' AND dm.patient_id = (SELECT id FROM patients WHERE email = ?)';
      params.push(req.user.email);
    }

    if (search) {
      where += ' AND (c.diagnostic_principal LIKE ? OR c.anamnese LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q);
    }

    const [rows] = await pool.execute(
      `SELECT c.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom,
              u_m.prenom AS medecin_prenom, u_m.nom  AS medecin_nom
       FROM consultations c
       JOIN dossiers_medicaux dm ON dm.id = c.dossier_medical_id
       JOIN patients p ON p.id = dm.patient_id
       JOIN medecins m  ON m.id = c.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       ${where}
       ORDER BY c.date_consultation DESC`,
      params
    );

    res.json({ consultations: rows });
  } catch (err) {
    console.error('getConsultations error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Single consultation ───────────────────────────────────
export const getConsultationById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*,
              p.prenom AS patient_prenom, p.nom AS patient_nom, p.email AS patient_email,
              u_m.prenom AS medecin_prenom, u_m.nom AS medecin_nom
       FROM consultations c
       JOIN dossiers_medicaux dm ON dm.id = c.dossier_medical_id
       JOIN patients p ON p.id = dm.patient_id
       JOIN medecins m ON m.id = c.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Consultation introuvable' });

    const [ordonnances] = await pool.execute(
      `SELECT o.*, lo.medicament_id, lo.designation_libre, lo.posologie, lo.duree_traitement
       FROM ordonnances o
       LEFT JOIN lignes_ordonnance lo ON lo.ordonnance_id = o.id
       WHERE o.consultation_id = ?`,
      [req.params.id]
    );

    res.json({ consultation: rows[0], ordonnances });
  } catch (err) {
    console.error('getConsultationById error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── Create consultation ───────────────────────────────────
export const createConsultation = async (req, res) => {
  const {
    rendez_vous_id,
    poids_kg, taille_cm, tension_sys, tension_dia, temperature,
    frequence_cardiaque, spo2,
    anamnese, examen_clinique, diagnostic_principal, codes_cim10, conduite_a_tenir,
    ordonnances = []
  } = req.body;

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Get medecin_id and patient info from rendez_vous
      const [rvRows] = await conn.execute(
        'SELECT medecin_id, patient_id FROM rendez_vous WHERE id = ?',
        [rendez_vous_id]
      );
      if (!rvRows.length) throw new Error('Rendez-vous introuvable');
      const { medecin_id, patient_id } = rvRows[0];

      // 2. Get dossier_medical_id
      const [dmRows] = await conn.execute(
        'SELECT id FROM dossiers_medicaux WHERE patient_id = ?',
        [patient_id]
      );
      if (!dmRows.length) throw new Error('Dossier médical introuvable');
      const dossier_medical_id = dmRows[0].id;

      // 3. Insert Consultation
      const [result] = await conn.execute(
        `INSERT INTO consultations
           (rendez_vous_id, dossier_medical_id, medecin_id, date_consultation,
            poids_kg, taille_cm, tension_sys, tension_dia, temperature,
            frequence_cardiaque, spo2, anamnese, examen_clinique,
            diagnostic_principal, codes_cim10, conduite_a_tenir)
         VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rendez_vous_id, dossier_medical_id, medecin_id,
          poids_kg || null, taille_cm || null, tension_sys || null, tension_dia || null,
          temperature || null, frequence_cardiaque || null, spo2 || null,
          anamnese || null, examen_clinique || null,
          diagnostic_principal || null, codes_cim10 || null, conduite_a_tenir || null
        ]
      );
      const consultId = result.insertId;

      // 4. Insert Ordonnance if provided
      if (ordonnances.length > 0) {
        const [ordResult] = await conn.execute(
          `INSERT INTO ordonnances (consultation_id, medecin_id, patient_id, date_emission)
           VALUES (?, ?, ?, CURDATE())`,
          [consultId, medecin_id, patient_id]
        );
        const ordId = ordResult.insertId;

        for (const line of ordonnances) {
          await conn.execute(
            `INSERT INTO lignes_ordonnance
               (ordonnance_id, designation_libre, posologie, duree_traitement)
             VALUES (?, ?, ?, ?)`,
            [ordId, line.medicament, line.posologie, line.duree]
          );
        }
      }

      // 5. Update appointment status
      await conn.execute(
        "UPDATE rendez_vous SET statut = 'termine' WHERE id = ?",
        [rendez_vous_id]
      );

      await conn.commit();
      res.status(201).json({ consultation_id: consultId, message: 'Consultation enregistrée' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('createConsultation error:', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
};