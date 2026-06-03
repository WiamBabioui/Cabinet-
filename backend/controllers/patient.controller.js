import pool from '../config/db.mysql.js';
import crypto from 'crypto';

// ✅ Générer un numéro de dossier unique
const generateNumDossier = () => {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `DOS-${year}-${rand}`;
};

// ✅ LISTE des patients (Pagination fixée)
export const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const statut = req.query.statut || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ` AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.telephone LIKE ? OR p.email LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (statut) {
      whereClause += ` AND p.statut = ?`;
      params.push(statut);
    }

    const [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM patients p ${whereClause}`, params);
    const total = countResult[0].total;

    const sql = `
      SELECT p.id, p.uuid, p.num_dossier, p.prenom, p.nom, p.date_naissance,
             p.sexe, p.telephone, p.email, p.adresse_ville, p.groupe_sanguin,
             p.assurance_nom, p.statut, p.created_at,
             CONCAT(u.prenom, ' ', u.nom) as medecin_traitant
      FROM patients p
      LEFT JOIN medecins m ON m.id = p.medecin_traitant_id
      LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`;

    const [patients] = await pool.execute(sql, [...params, limit, offset]);

    res.json({
      patients,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getPatients error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ CRÉER un patient (FIX : Colonnes et valeurs alignées)
export const createPatient = async (req, res) => {
  const {
    prenom, nom, date_naissance, sexe, telephone,
    email, cin, adresse_rue, adresse_ville, adresse_code_postal,
    adresse_pays, groupe_sanguin, assurance_nom, assurance_numero,
    medecin_traitant_id, notes_admin
  } = req.body;

  try {
    const num_dossier = generateNumDossier();
    const uuid = crypto.randomUUID();

    // On définit 19 colonnes
    const sql = `INSERT INTO patients
        (uuid, num_dossier, prenom, nom, date_naissance, sexe, telephone, email, cin,
         adresse_rue, adresse_ville, adresse_code_postal, adresse_pays,
         groupe_sanguin, assurance_nom, assurance_numero,
         medecin_traitant_id, notes_admin, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // 19 points d'interrogation

    // On envoie 19 valeurs dans le tableau
    const values = [
        uuid, num_dossier, prenom, nom, date_naissance, sexe, telephone,
        email || null, cin || null, adresse_rue || null, adresse_ville || null,
        adresse_code_postal || null, adresse_pays || 'Maroc',
        groupe_sanguin || null, assurance_nom || null, assurance_numero || null,
        medecin_traitant_id || null, notes_admin || null, 'actif'
    ];

    const [result] = await pool.execute(sql, values);
    const patientId = result.insertId;

    // Création automatique du dossier médical
    await pool.execute('INSERT INTO dossiers_medicaux (patient_id) VALUES (?)', [patientId]);

    res.status(201).json({ message: 'Patient créé avec succès', patient_id: patientId, num_dossier });

  } catch (err) {
    console.error('createPatient error:', err);
    res.status(500).json({ message: 'Erreur lors de la création : ' + err.message });
  }
};

// ... (Gardez le reste des fonctions getPatientById, updatePatient, etc. tel quel)

// ✅ UN SEUL patient avec son dossier médical
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [patients] = await pool.execute(
      `SELECT p.*, CONCAT(u.prenom, ' ', u.nom) as medecin_traitant
       FROM patients p
       LEFT JOIN medecins m ON m.id = p.medecin_traitant_id
       LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [id]
    );

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient introuvable' });
    }

    const [dossier] = await pool.execute('SELECT * FROM dossiers_medicaux WHERE patient_id = ?', [id]);
    
    const [consultations] = await pool.execute(
      `SELECT c.id, c.date_consultation, c.diagnostic_principal, CONCAT(u.prenom, ' ', u.nom) as medecin
       FROM consultations c
       JOIN medecins m ON m.id = c.medecin_id
       JOIN utilisateurs u ON u.id = m.utilisateur_id
       JOIN dossiers_medicaux dm ON dm.id = c.dossier_medical_id
       WHERE dm.patient_id = ? ORDER BY c.date_consultation DESC LIMIT 5`,
      [id]
    );

    const [rendezvous] = await pool.execute(
      `SELECT id, date_heure_debut, motif, statut FROM rendez_vous 
       WHERE patient_id = ? ORDER BY date_heure_debut DESC LIMIT 5`,
      [id]
    );

    res.json({
      patient: patients[0],
      dossier_medical: dossier[0] || null,
      consultations,
      rendezvous
    });

  } catch (err) {
    console.error('getPatientById error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ MODIFIER un patient
export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    await pool.execute(
      `UPDATE patients SET
        prenom = ?, nom = ?, date_naissance = ?, sexe = ?, telephone = ?,
        email = ?, cin = ?, adresse_rue = ?, adresse_ville = ?,
        adresse_code_postal = ?, adresse_pays = ?, groupe_sanguin = ?,
        assurance_nom = ?, assurance_numero = ?, medecin_traitant_id = ?,
        statut = ?, notes_admin = ?
       WHERE id = ?`,
      [
        data.prenom, data.nom, data.date_naissance, data.sexe, data.telephone,
        data.email || null, data.cin || null, data.adresse_rue || null, data.adresse_ville || null,
        data.adresse_code_postal || null, data.adresse_pays || 'Maroc',
        data.groupe_sanguin || null, data.assurance_nom || null, data.assurance_numero || null,
        data.medecin_traitant_id || null, data.statut || 'actif', data.notes_admin || null,
        id
      ]
    );
    res.json({ message: 'Patient mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// ✅ SUPPRIMER un patient (soft delete)
export const deletePatient = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE patients SET deleted_at = NOW(), statut = "archive" WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'Patient archivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

// ✅ METTRE À JOUR le dossier médical
export const updateDossierMedical = async (req, res) => {
  const { id } = req.params;
  const d = req.body;
  try {
    await pool.execute(
      `UPDATE dossiers_medicaux SET
        allergies = ?, antecedents_perso = ?, antecedents_familiaux = ?,
        traitements_en_cours = ?, vaccinations = ?, mode_vie = ?
       WHERE patient_id = ?`,
      [d.allergies, d.antecedents_perso, d.antecedents_familiaux, d.traitements_en_cours, 
       d.vaccinations ? JSON.stringify(d.vaccinations) : null, d.mode_vie, id]
    );
    res.json({ message: 'Dossier mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur dossier' });
  }
};

// ✅ DONNÉES DU PORTAIL PATIENT
export const getPortalData = async (req, res) => {
  const { email } = req.user;
  try {
    const [patients] = await pool.execute(
      'SELECT * FROM patients WHERE email = ? AND deleted_at IS NULL', [email]
    );
    if (patients.length === 0) return res.status(404).json({ message: 'Profil non trouvé' });
    
    const p = patients[0];
    const [dossier] = await pool.execute('SELECT * FROM dossiers_medicaux WHERE patient_id = ?', [p.id]);
    
    res.json({ patient: p, dossier: dossier[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Erreur portail' });
  }
};