import pool from '../config/db.mysql.js';
import crypto from 'crypto';

// ✅ Générer un numéro de dossier unique
const generateNumDossier = () => {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `DOS-${year}-${rand}`;
};

// ✅ LISTE des patients (Pagination 100% sécurisée)
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

    // Calcul du total
    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM patients p ${whereClause}`, params);
    const total = countResult[0].total;

    // Utilisation de pool.query ici pour éviter les bugs de LIMIT/OFFSET avec execute
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
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [patients] = await pool.query(sql, params);

    res.json({
      patients,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('getPatients error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement : ' + err.message });
  }
};

// ✅ CRÉER un patient (Colonnes et valeurs alignées)
export const createPatient = async (req, res) => {
  const p = req.body;
  try {
    const num_dossier = generateNumDossier();
    const uuid = crypto.randomUUID();

    const sql = `INSERT INTO patients
        (uuid, num_dossier, prenom, nom, date_naissance, sexe, telephone, email, cin,
         adresse_rue, adresse_ville, adresse_code_postal, adresse_pays,
         groupe_sanguin, assurance_nom, assurance_numero,
         medecin_traitant_id, notes_admin, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        uuid, num_dossier, p.prenom, p.nom, p.date_naissance, p.sexe, p.telephone,
        p.email || null, p.cin || null, p.adresse_rue || null, p.adresse_ville || null,
        p.adresse_code_postal || null, p.adresse_pays || 'Maroc',
        p.groupe_sanguin || null, p.assurance_nom || null, p.assurance_numero || null,
        p.medecin_traitant_id || null, p.notes_admin || null, 'actif'
    ];

    const [result] = await pool.execute(sql, values);
    const patientId = result.insertId;

    // Création dossier médical
    await pool.execute('INSERT INTO dossiers_medicaux (patient_id) VALUES (?)', [patientId]);

    res.status(201).json({ message: 'Patient créé avec succès', patient_id: patientId, num_dossier });
  } catch (err) {
    console.error('createPatient error:', err);
    res.status(500).json({ message: 'Erreur lors de la création : ' + err.message });
  }
};

// ✅ RÉCUPÉRER UN PATIENT PAR ID
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [patients] = await pool.execute(
      `SELECT p.*, CONCAT(u.prenom, ' ', u.nom) as medecin_traitant
       FROM patients p
       LEFT JOIN medecins m ON m.id = p.medecin_traitant_id
       LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
       WHERE p.id = ? AND p.deleted_at IS NULL`, [id]
    );

    if (patients.length === 0) return res.status(404).json({ message: 'Patient introuvable' });

    const [dossier] = await pool.execute('SELECT * FROM dossiers_medicaux WHERE patient_id = ?', [id]);
    res.json({ patient: patients[0], dossier_medical: dossier[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ MODIFIER UN PATIENT
export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await pool.execute(
      `UPDATE patients SET prenom=?, nom=?, date_naissance=?, sexe=?, telephone=?, email=?, cin=?, statut=? WHERE id=?`,
      [data.prenom, data.nom, data.date_naissance, data.sexe, data.telephone, data.email, data.cin, data.statut || 'actif', id]
    );
    res.json({ message: 'Patient mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// ✅ SUPPRIMER UN PATIENT (Soft delete)
export const deletePatient = async (req, res) => {
  try {
    await pool.execute('UPDATE patients SET deleted_at = NOW(), statut = "archive" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patient archivé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

// ✅ PORTAIL PATIENT
export const getPortalData = async (req, res) => {
  const { email } = req.user;
  try {
    const [p] = await pool.execute('SELECT * FROM patients WHERE email = ? AND deleted_at IS NULL', [email]);
    if (p.length === 0) return res.status(404).json({ message: 'Profil non trouvé' });
    res.json({ patient: p[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur portail' });
  }
};