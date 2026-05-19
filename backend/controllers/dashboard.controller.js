import pool from '../config/db.mysql.js';

// ✅ STATS GÉNÉRALES du dashboard (Dev A)
export const getDashboardStats = async (req, res) => {
  try {
    // Total patients actifs
    const [[{ total_patients }]] = await pool.execute(
      "SELECT COUNT(*) as total_patients FROM patients WHERE statut = 'actif' AND deleted_at IS NULL"
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
       AND deleted_at IS NULL`
    );

    // RDV aujourd'hui
    const [[{ rdv_aujourd_hui }]] = await pool.execute(
      `SELECT COUNT(*) as rdv_aujourd_hui FROM rendez_vous
       WHERE DATE(date_heure_debut) = CURDATE()
       AND statut NOT IN ('annule', 'absent')`
    );

    // RDV ce mois par statut
    const [rdv_par_statut] = await pool.execute(
      `SELECT statut, COUNT(*) as total FROM rendez_vous
       WHERE MONTH(date_heure_debut) = MONTH(NOW())
       GROUP BY statut`
    );

    // Patients par mois (6 derniers mois) pour le graphique
    const [patients_par_mois] = await pool.execute(
  `SELECT
    DATE_FORMAT(created_at, '%Y-%m') as mois,
    DATE_FORMAT(created_at, '%b') as label,
    COUNT(*) as total
   FROM patients
   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
   AND deleted_at IS NULL
   GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b'), DATE_FORMAT(created_at, '%b')
   ORDER BY mois ASC`
);

    // Répartition par sexe
    const [repartition_sexe] = await pool.execute(
      `SELECT sexe, COUNT(*) as total FROM patients
       WHERE deleted_at IS NULL AND statut = 'actif'
       GROUP BY sexe`
    );

    res.json({
      stats: {
        total_patients,
        total_users,
        total_medecins,
        nouveaux_patients,
        rdv_aujourd_hui,
      },
      rdv_par_statut,
      patients_par_mois,
      repartition_sexe,
    });

  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ✅ RDV du jour pour le dashboard
export const getRdvAujourdhui = async (req, res) => {
  try {
    const [rdv] = await pool.execute(
      `SELECT rv.id, rv.date_heure_debut, rv.date_heure_fin, rv.motif,
              rv.type_consultation, rv.statut,
              CONCAT(p.prenom, ' ', p.nom) as patient_nom,
              p.telephone as patient_telephone
       FROM rendez_vous rv
       JOIN patients p ON p.id = rv.patient_id
       WHERE DATE(rv.date_heure_debut) = CURDATE()
       ORDER BY rv.date_heure_debut ASC`
    );

    res.json({ rdv });

  } catch (err) {
    console.error('getRdvAujourdhui error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};