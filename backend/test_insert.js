import pool from './config/db.mysql.js';

async function testInsert() {
  try {
    const patient_id = 1; // Assuming 1 exists, if not this will fail with FK error
    const mid = 1;
    const date_heure = '2026-05-08 14:00:00';
    const date_heure_fin = '2026-05-08 14:30:00';
    const type_rdv = 'suivi';
    const motif = 'Test Insert';
    const notes = null;

    console.log('Attempting insert...');
    const [result] = await pool.execute(
      `INSERT INTO rendez_vous (patient_id, medecin_id, secretaire_id, date_heure_debut, date_heure_fin, type_consultation, motif, notes, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        mid,
        null,
        date_heure,
        date_heure_fin,
        type_rdv,
        motif,
        notes,
        'planifie'
      ]
    );
    console.log('Insert result:', result);
    process.exit(0);
  } catch (err) {
    console.error('INSERT ERROR:', err.message);
    if (err.code) console.error('Error Code:', err.code);
    process.exit(1);
  }
}

testInsert();
