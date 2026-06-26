import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'cabinet_plus',
  port:     3306,
});

async function run() {
  try {
    console.log('Seeding Cypress test users...');
    
    // 1. Delete existing users to ensure clean state
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete from patients linked to these users
    await pool.execute(`
      DELETE p FROM patients p
      JOIN utilisateurs u ON p.email = u.email
      WHERE u.email LIKE '%@cypress-test.com'
    `);
    
    // Delete from medecins
    await pool.execute(`
      DELETE m FROM medecins m
      JOIN utilisateurs u ON m.utilisateur_id = u.id
      WHERE u.email LIKE '%@cypress-test.com'
    `);

    // Delete from utilisateurs
    await pool.execute("DELETE FROM utilisateurs WHERE email LIKE '%@cypress-test.com'");
    
    // 2. Generate correct bcrypt hash for 'CypressTest123!'
    const hash = await bcrypt.hash('CypressTest123!', 10);
    console.log('Generated hash:', hash);

    // 3. Create specialty if not exists
    let specialiteId = 1;
    const [specRows] = await pool.execute('SELECT id FROM specialites LIMIT 1');
    if (specRows.length === 0) {
      const [specRes] = await pool.execute("INSERT INTO specialites (nom, description) VALUES ('Généraliste', 'Médecine générale')");
      specialiteId = specRes.insertId;
    } else {
      specialiteId = specRows[0].id;
    }
    
    // 4. Insert medecin user
    const [medecinRes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, email_verifie)
       VALUES ('medecin@cypress-test.com', ?, 'medecin', 'Jean', 'Medecin', 1, 1)`,
      [hash]
    );
    const medecinUserId = medecinRes.insertId;

    // 5. Insert medecin record
    const [medecinRecordRes] = await pool.execute(
      `INSERT INTO medecins (utilisateur_id, specialite_id, num_ordre)
       VALUES (?, ?, ?)`,
      [medecinUserId, specialiteId, 'ORDRE-CYPRESS-123']
    );
    const medecinId = medecinRecordRes.insertId;

    // 6. Insert admin user
    await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, email_verifie)
       VALUES ('admin@cypress-test.com', ?, 'admin', 'Admin', 'Cypress', 1, 1)`,
      [hash]
    );

    // 7. Insert secretary user
    await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, email_verifie, assigned_doctor_id)
       VALUES ('secretaire@cypress-test.com', ?, 'secretaire', 'Sophie', 'Secretaire', 1, 1, ?)`,
      [hash, medecinUserId]
    );

    // 8. Insert patient user
    const [patientRes] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, actif, email_verifie, assigned_doctor_id)
       VALUES ('patient@cypress-test.com', ?, 'patient', 'Paul', 'Patient', 1, 1, ?)`,
      [hash, medecinUserId]
    );
    const patientUserId = patientRes.insertId;

    // 9. Insert patient record
    const numDossier = `DOS-CYPRESS-${patientUserId}`;
    const uuid = `cypress-patient-uuid-${patientUserId}`;
    await pool.execute(
      `INSERT INTO patients (email, prenom, nom, num_dossier, uuid, sexe, medecin_traitant_id)
       VALUES ('patient@cypress-test.com', 'Paul', 'Patient', ?, ?, 'M', ?)`,
      [numDossier, uuid, medecinId]
    );

    console.log('✅ Cypress test users seeded successfully in dev database!');
  } catch (err) {
    console.error('❌ Error seeding Cypress users:', err);
  } finally {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    await pool.end();
  }
}

run();
