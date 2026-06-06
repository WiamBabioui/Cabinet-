import pool from '../config/db.mysql.js';
import crypto from 'crypto'; // Ajouté pour générer l'UUID manquant

// ✅ Générer un numéro de dossier unique
const generateNumDossier = () => {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `DOS-${year}-${rand}`;
};

// ✅ LISTE des patients (Correction du problème LIMIT/OFFSET)
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

    // Total pour la pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM patients p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Correction : On utilise pool.query et on injecte les nombres limit/offset directement 
    // pour éviter l'erreur "Incorrect arguments to mysqld_stmt_execute"
    const sql = `SELECT p.id, p.uuid, p.num_dossier, p.prenom, p.nom, p.date_naissance,
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
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('getPatients error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération' });
  }
};

// ✅ CRÉER un patient (Correction de l'alignement des colonnes)
export const createPatient = async (req, res) => {
  const {
    prenom, nom, date_naissance, sexe, telephone,
    email, cin, adresse_rue, adresse_ville, adresse_code_postal,
    adresse_pays, groupe_sanguin, assurance_nom, assurance_numero,
    medecin_traitant_id, notes_admin
  } = req.body;

  try {
    const num_dossier = generateNumDossier();
    const uuid = crypto.randomUUID(); // Génération de l'UUID requis par la table

    // Ajout de uuid et statut pour correspondre au nombre de colonnes attendu
    const sql = `INSERT INTO patients
        (uuid, num_dossier, prenom, nom, date_naissance, sexe, telephone, email, cin,
         adresse_rue, adresse_ville, adresse_code_postal, adresse_pays,
         groupe_sanguin, assurance_nom, assurance_numero,
         medecin_traitant_id, notes_admin, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // 19 colonnes / 19 ?

    const [result] = await pool.execute(sql, [
        uuid, num_dossier, prenom, nom, date_naissance, sexe, telephone,
        email || null, cin || null, adresse_rue || null, adresse_ville || null,
        adresse_code_postal || null, adresse_pays || 'Maroc',
        groupe_sanguin || null, assurance_nom || null, assurance_numero || null,
        medecin_traitant_id || null, notes_admin || null, 'actif'
    ]);

    const patientId = result.insertId;

    await pool.execute(
      'INSERT INTO dossiers_medicaux (patient_id) VALUES (?)',
      [patientId]
    );

    res.status(201).json({
      message: 'Patient créé avec succès',
      patient_id: patientId,
      num_dossier
    });

  } catch (err) {
    console.error('createPatient error:', err);
    res.status(500).json({ message: 'Erreur serveur : ' + err.message });
  }
};

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

    const [dossier] = await pool.execute(
      'SELECT * FROM dossiers_medicaux WHERE patient_id = ?',
      [id]
    );

    const [consultations] = await pool.execute(
      `SELECT c.id, c.date_consultation, c.diagnostic_principal, c.anamnese,
              CONCAT(u.prenom, ' ', u.nom) as medecin
       FROM consultations c
       JOIN medecins m ON m.id = c.medecin_id
       JOIN utilisateurs u ON u.id = m.utilisateur_id
       JOIN dossiers_medicaux dm ON dm.id = c.dossier_medical_id
       WHERE dm.patient_id = ?
       ORDER BY c.date_consultation DESC
       LIMIT 5`,
      [id]
    );

    const [rendezvous] = await pool.execute(
      `SELECT rv.id, rv.date_heure_debut, rv.motif, rv.statut, rv.type_consultation
       FROM rendez_vous rv
       WHERE rv.patient_id = ?
       ORDER BY rv.date_heure_debut DESC
       LIMIT 5`,
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
  const {
    prenom, nom, date_naissance, sexe, telephone, email, cin,
    adresse_rue, adresse_ville, adresse_code_postal, adresse_pays,
    groupe_sanguin, assurance_nom, assurance_numero,
    medecin_traitant_id, statut, notes_admin
  } = req.body;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM patients WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Patient introuvable' });
    }

    await pool.execute(
      `UPDATE patients SET
        prenom = ?, nom = ?, date_naissance = ?, sexe = ?, telephone = ?,
        email = ?, cin = ?, adresse_rue = ?, adresse_ville = ?,
        adresse_code_postal = ?, adresse_pays = ?, groupe_sanguin = ?,
        assurance_nom = ?, assurance_numero = ?, medecin_traitant_id = ?,
        statut = ?, notes_admin = ?
       WHERE id = ?`,
      [
        prenom, nom, date_naissance, sexe, telephone,
        email || null, cin || null, adresse_rue || null, adresse_ville || null,
        adresse_code_postal || null, adresse_pays || 'Maroc',
        groupe_sanguin || null, assurance_nom || null, assurance_numero || null,
        medecin_traitant_id || null, statut || 'actif', notes_admin || null,
        id
      ]
    );

    res.json({ message: 'Patient mis à jour avec succès' });

  } catch (err) {
    console.error('updatePatient error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ SUPPRIMER un patient (soft delete)
export const deletePatient = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM patients WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Patient introuvable' });
    }

    await pool.execute(
      'UPDATE patients SET deleted_at = NOW(), statut = "archive" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Patient archivé avec succès' });

  } catch (err) {
    console.error('deletePatient error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ METTRE À JOUR le dossier médical
export const updateDossierMedical = async (req, res) => {
  const { id } = req.params; 
  const {
    allergies, antecedents_perso, antecedents_familiaux,
    traitements_en_cours, vaccinations, mode_vie
  } = req.body;

  try {
    await pool.execute(
      `UPDATE dossiers_medicaux SET
        allergies = ?, antecedents_perso = ?, antecedents_familiaux = ?,
        traitements_en_cours = ?, vaccinations = ?, mode_vie = ?
       WHERE patient_id = ?`,
      [
        allergies || null, antecedents_perso || null,
        antecedents_familiaux || null, traitements_en_cours || null,
        vaccinations ? JSON.stringify(vaccinations) : null,
        mode_vie || null, id
      ]
    );

    res.json({ message: 'Dossier médical mis à jour' });

  } catch (err) {
    console.error('updateDossierMedical error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ DONNÉES DU PORTAIL PATIENT
export const getPortalData = async (req, res) => {
  const { email } = req.user;
  console.log(`[PortalData] Fetching portal data for email: ${email}`);
  try {
    let [patients] = await pool.execute(
      `SELECT p.*, CONCAT(u.prenom, ' ', u.nom) as medecin_traitant
       FROM patients p
       LEFT JOIN medecins m ON m.id = p.medecin_traitant_id
       LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
       WHERE p.email = ? AND p.deleted_at IS NULL`,
      [email]
    );

    console.log(`[PortalData] Initial lookup found ${patients.length} records`);

    if (patients.length === 0) {
      console.log(`[PortalData] No patient record found for ${email}. Attempting lazy creation...`);
      // Lazy-create patients profile + medical file if user is a registered patient in utilisateurs
      const [userRows] = await pool.execute(
        `SELECT id, prenom, nom, telephone, assigned_doctor_id, role FROM utilisateurs WHERE email = ? AND deleted_at IS NULL`,
        [email]
      );

      console.log(`[PortalData] User lookup found ${userRows.length} user records`);

      if (userRows.length > 0) {
        const u = userRows[0];
        console.log(`[PortalData] User found: ${u.email}, Role: ${u.role}`);
        
        if (u.role.toLowerCase() !== 'patient') {
          console.warn(`[PortalData] User ${email} has role ${u.role}, NOT patient. Denying portal access.`);
          return res.status(403).json({ message: 'Seuls les patients peuvent accéder à ce portail' });
        }

        let medecinTraitantId = null;
        if (u.assigned_doctor_id) {
          const [medecinRows] = await pool.execute(
            `SELECT id FROM medecins WHERE utilisateur_id = ?`,
            [u.assigned_doctor_id]
          );
          if (medecinRows.length > 0) {
            medecinTraitantId = medecinRows[0].id;
          }
        }

        const num_dossier = generateNumDossier();
        const uuid = crypto.randomUUID();

        console.log(`[PortalData] Creating new patient record for ${email} with dossier ${num_dossier}`);

        const sql = `INSERT INTO patients
            (uuid, num_dossier, prenom, nom, date_naissance, sexe, telephone, email, cin,
             adresse_rue, adresse_ville, adresse_code_postal, adresse_pays,
             groupe_sanguin, assurance_nom, assurance_numero,
             medecin_traitant_id, notes_admin, statut)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await pool.execute(sql, [
          uuid, num_dossier, u.prenom, u.nom, null, 'M', u.telephone || null,
          email, null, null, null, null, 'Maroc',
          null, null, null, medecinTraitantId, null, 'actif'
        ]);

        const patientId = result.insertId;
        console.log(`[PortalData] New patient created with ID: ${patientId}`);

        await pool.execute(
          'INSERT INTO dossiers_medicaux (patient_id) VALUES (?)',
          [patientId]
        );
        console.log(`[PortalData] Medical file created for patient ID: ${patientId}`);

        const [reFetch] = await pool.execute(
          `SELECT p.*, CONCAT(u.prenom, ' ', u.nom) as medecin_traitant
           FROM patients p
           LEFT JOIN medecins m ON m.id = p.medecin_traitant_id
           LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
           WHERE p.id = ?`,
          [patientId]
        );
        patients = reFetch;
      } else {
        console.warn(`[PortalData] No user record found in utilisateurs for email: ${email}`);
      }
    }

    if (patients.length === 0) {
      console.error(`[PortalData] Failed to resolve patient record for ${email}`);
      return res.status(404).json({ message: 'Profil patient non trouvé' });
    }

    const patient = patients[0];
    console.log(`[PortalData] Successfully resolved patient: ${patient.prenom} ${patient.nom} (ID: ${patient.id})`);

    const [dossier] = await pool.execute(
      'SELECT * FROM dossiers_medicaux WHERE patient_id = ?',
      [patient.id]
    );

    const [prochainsRDV] = await pool.execute(
      `SELECT rv.*, u_m.prenom as medecin_prenom, u_m.nom as medecin_nom
       FROM rendez_vous rv
       JOIN medecins m ON m.id = rv.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       WHERE rv.patient_id = ? AND rv.date_heure_debut >= NOW() AND rv.statut != 'annule'
       ORDER BY rv.date_heure_debut ASC
       LIMIT 1`,
      [patient.id]
    );

    const [consultations] = await pool.execute(
      `SELECT c.*, CONCAT(u_m.prenom, ' ', u_m.nom) as medecin_nom
       FROM consultations c
       JOIN dossiers_medicaux dm ON dm.id = c.dossier_medical_id
       JOIN medecins m ON m.id = c.medecin_id
       JOIN utilisateurs u_m ON u_m.id = m.utilisateur_id
       WHERE dm.patient_id = ?
       ORDER BY c.date_consultation DESC
       LIMIT 5`,
      [patient.id]
    );

    res.json({
      patient,
      dossier: dossier[0] || null,
      prochainRDV: prochainsRDV[0] || null,
      consultations
    });

  } catch (err) {
    console.error('getPortalData error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};