import pool from '../config/db.mysql.js';

// ✅ STATS GÉNÉRALES du dashboard (avec filtre par rôle)
export const getDashboardStats = async (req, res) => {
  try {
    const { role, id } = req.user;
    const userRole = role?.toLowerCase().trim();

    // ─── Trouver le doctorId (utilisateurs.id) selon le rôle ───────────────────
    let doctorId = null;

    if (userRole === 'medecin') {
      doctorId = Number(id);
    } else if (userRole === 'secretaire') {
      const [userRows] = await pool.execute(
        'SELECT assigned_doctor_id FROM utilisateurs WHERE id = ?',
        [Number(id)]
      );
      doctorId = userRows[0]?.assigned_doctor_id || null;
    }

    // ─── Trouver le medecinDbId (medecins.id) pour filtrer les rendez-vous ─────
    let medecinDbId = null;
    if (doctorId) {
      const [medecinRows] = await pool.execute(
        'SELECT id FROM medecins WHERE utilisateur_id = ?',
        [Number(doctorId)]
      );
      medecinDbId = medecinRows[0]?.id || null;
    }

    // ─── Filtre patients ──────────────────────────────────────
    const patientFilter = doctorId
      ? `AND medecin_traitant_id = ${Number(doctorId)}`
      : '';

    // ─── Filtre rendez-vous ───────────────────────────────────
    const appointmentFilter = medecinDbId
      ? `AND medecin_id = ${Number(medecinDbId)}`
      : '';

    // Total patients actifs
    const [[{ total_patients }]] = await pool.execute(
      `SELECT COUNT(*) as total_patients FROM patients
       WHERE statut = 'actif' AND deleted_at IS NULL ${patientFilter}`
    );

    // Total utilisateurs actifs
    const [[{ total_users }]] = await pool.execute(
      "SELECT COUNT(*) as total_users FROM utilisateurs WHERE actif = 1 AND deleted_at IS NULL"
    );

    // Total médecins
    const [[{ total_medecins }]] = await pool.execute(
      "SELECT COUNT(*) as total_medecins FROM medecins WHERE disponible = 1"
    );

    // Nouveaux patients ce mois
    const [[{ nouveaux_patients }]] = await pool.execute(
      `SELECT COUNT(*) as nouveaux_patients FROM patients
       WHERE MONTH(created_at) = MONTH(NOW())
       AND YEAR(created_at) = YEAR(NOW())
       AND deleted_at IS NULL ${patientFilter}`
    );

    // RDV aujourd'hui
    const [[{ rdv_aujourd_hui }]] = await pool.execute(
      `SELECT COUNT(*) as rdv_aujourd_hui FROM rendez_vous
       WHERE DATE(date_heure_debut) = CURDATE()
       AND statut NOT IN ('annule', 'absent') ${appointmentFilter}`
    );

    // RDV ce mois par statut
    const [rdv_par_statut] = await pool.execute(
      `SELECT statut, COUNT(*) as total FROM rendez_vous
       WHERE MONTH(date_heure_debut) = MONTH(NOW())
       ${appointmentFilter}
       GROUP BY statut`
    );

    // Patients par mois (6 derniers mois)
    const [patients_par_mois] = await pool.execute(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') as mois,
        DATE_FORMAT(created_at, '%b') as label,
        COUNT(*) as total
       FROM patients
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       AND deleted_at IS NULL ${patientFilter}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
       ORDER BY mois ASC`
    );

    // Répartition par sexe
    const [repartition_sexe] = await pool.execute(
      `SELECT sexe, COUNT(*) as total FROM patients
       WHERE deleted_at IS NULL AND statut = 'actif' ${patientFilter}
       GROUP BY sexe`
    );

    res.status(200).json({
      stats: {
        total_patients: total_patients ?? 0,
        total_users: total_users ?? 0,
        total_medecins: total_medecins ?? 0,
        nouveaux_patients: nouveaux_patients ?? 0,
        rdv_aujourd_hui: rdv_aujourd_hui ?? 0,
      },
      rdv_par_statut: rdv_par_statut || [],
      patients_par_mois: patients_par_mois || [],
      repartition_sexe: repartition_sexe || [],
    });

  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(200).json({
      stats: {
        total_patients: 0,
        total_users: 0,
        total_medecins: 0,
        nouveaux_patients: 0,
        rdv_aujourd_hui: 0,
      },
      rdv_par_statut: [],
      patients_par_mois: [],
      repartition_sexe: [],
    });
  }
};

// ✅ RDV du jour pour le dashboard
export const getRdvAujourdhui = async (req, res) => {
  try {
    const { role, id } = req.user;
    const userRole = role?.toLowerCase().trim();
    let doctorId = null;

    if (userRole === 'medecin') {
      doctorId = Number(id);
    } else if (userRole === 'secretaire') {
      const [userRows] = await pool.execute(
        'SELECT assigned_doctor_id FROM utilisateurs WHERE id = ?',
        [Number(id)]
      );
      doctorId = userRows[0]?.assigned_doctor_id || null;
    }

    let medecinDbId = null;
    if (doctorId) {
      const [medecinRows] = await pool.execute(
        'SELECT id FROM medecins WHERE utilisateur_id = ?',
        [Number(doctorId)]
      );
      medecinDbId = medecinRows[0]?.id || null;
    }

    const queryParams = [];
    let appointmentFilter = '';
    if (medecinDbId) {
      appointmentFilter = 'AND rv.medecin_id = ?';
      queryParams.push(Number(medecinDbId));
    }

    const [rdv] = await pool.execute(
      `SELECT rv.id, rv.date_heure_debut, rv.date_heure_fin, rv.motif,
              rv.type_consultation, rv.statut,
              CONCAT(p.prenom, ' ', p.nom) as patient_nom,
              p.telephone as patient_telephone
       FROM rendez_vous rv
       JOIN patients p ON p.id = rv.patient_id
       WHERE DATE(rv.date_heure_debut) = CURDATE()
       ${appointmentFilter}
       ORDER BY rv.date_heure_debut ASC`,
      queryParams
    );

    res.status(200).json({ rdv });

  } catch (err) {
    console.error('getRdvAujourdhui error:', err);
    res.status(200).json({ rdv: [] });
  }
};