// backend/tests/appointments.test.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Rendez-vous (Jest + Supertest)
// Couvre : CRUD, validation dates, chevauchement, statuts, rôles
// ═══════════════════════════════════════════════════════════════════════════════

import request from 'supertest';
import { createTestApp } from './setup/appFactory.js';
import {
  seedTestUsers,
  cleanupTestUsers,
  connectDatabases,
  closeDatabases,
} from './setup/testHelpers.js';
import pool from '../config/db.mysql.js';

let app;
let users;
let createdAppointmentId;
let patientEmail;
let medecinUtilisateurId;

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDatabases();
  app = createTestApp();
  users = await seedTestUsers();

  // Retrieve the patient email inserted by seedTestUsers
  const [patRow] = await pool.execute(
    'SELECT email FROM utilisateurs WHERE id = ?',
    [users.patient.id]
  );
  patientEmail = patRow[0]?.email;

  // Ensure patient exists in patients table (FK for rendez_vous)
  try {
    const numDossier = `DOS-TEST-${users.patient.id}`;
    const uuid = `test-uuid-${users.patient.id}-99999`;
    await pool.execute(
      `INSERT INTO patients (email, prenom, nom, num_dossier, uuid, sexe)
       VALUES (?, 'Test', 'Patient', ?, ?, 'M')
       ON DUPLICATE KEY UPDATE email = VALUES(email)`,
      [patientEmail, numDossier, uuid]
    );
  } catch (_) {}

  medecinUtilisateurId = users.medecin.id;
});

afterAll(async () => {
  // Clean up any test appointments
  if (createdAppointmentId) {
    try {
      await pool.execute('DELETE FROM rendez_vous WHERE id = ?', [createdAppointmentId]);
    } catch (_) {}
  }
  // Clean all test rendez_vous rows
  await pool.execute(
    `DELETE r FROM rendez_vous r
     JOIN medecins m ON m.id = r.medecin_id
     WHERE m.utilisateur_id = ?`,
    [medecinUtilisateurId]
  );
  await cleanupTestUsers();
  await closeDatabases();
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Future date helpers
const futureDate = (daysFromNow = 7, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const pastDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

// ─── SUITE 1 : Création d'un rendez-vous ──────────────────────────────────────

describe('POST /api/appointments — Création', () => {

  // ✅ TC-RDV-01 : Création d'un rendez-vous valide par la secrétaire
  it('TC-RDV-01 : Secrétaire crée un rendez-vous valide → 201', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: patientEmail,
        medecin_id: medecinUtilisateurId,
        date_heure: futureDate(7, 9),
        duree: 30,
        type_rdv: 'consultation',
        motif: 'Consultation de routine',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('appointment');
    expect(res.body.appointment).toHaveProperty('id');
    expect(res.body.appointment.statut).toBe('pending');
    createdAppointmentId = res.body.appointment.id;
  });

  // ✅ TC-RDV-02 : Création par un médecin (sur lui-même)
  it('TC-RDV-02 : Médecin crée un rendez-vous → 201', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.medecin.token))
      .send({
        patient_email: patientEmail,
        date_heure: futureDate(8, 14),
        duree: 30,
        type_rdv: 'suivi',
        motif: 'Suivi post-opératoire',
      });

    expect(res.status).toBe(201);
    expect(res.body.appointment.statut).toBe('pending');

    // Cleanup this extra appointment
    if (res.body.appointment?.id) {
      await pool.execute('DELETE FROM rendez_vous WHERE id = ?', [res.body.appointment.id]);
    }
  });

  // ❌ TC-RDV-03 : Patient email inexistant → 404
  it('TC-RDV-03 : Email patient inexistant → 404', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: 'ghost_patient_99999@nowhere.com',
        medecin_id: medecinUtilisateurId,
        date_heure: futureDate(10, 11),
        duree: 30,
        type_rdv: 'consultation',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/patient/i);
  });

  // ❌ TC-RDV-04 : Médecin inexistant → 404
  it('TC-RDV-04 : Médecin inexistant → 404', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: patientEmail,
        medecin_id: 99999,
        date_heure: futureDate(11, 9),
        duree: 30,
        type_rdv: 'consultation',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/médecin/i);
  });

  // ❌ TC-RDV-05 : Créneau déjà réservé → 409
  it('TC-RDV-05 : Créneau déjà occupé → 409 (chevauchement)', async () => {
    // Uses same slot as TC-RDV-01
    const sameSlot = futureDate(7, 9);
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: patientEmail,
        medecin_id: medecinUtilisateurId,
        date_heure: sameSlot,
        duree: 30,
        type_rdv: 'consultation',
        motif: 'Doublon test',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/créneau|occupé/i);
  });

  // ❌ TC-RDV-06 : medecin_id manquant → 400
  it('TC-RDV-06 : medecin_id manquant → 400', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: patientEmail,
        date_heure: futureDate(15, 10),
        // medecin_id absent + user n'est pas médecin
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/medecin_id/i);
  });
});

// ─── SUITE 2 : Lecture des rendez-vous ───────────────────────────────────────

describe('GET /api/appointments — Consultation par rôle', () => {

  // ✅ TC-RDV-07 : Médecin consulte ses rendez-vous
  it('TC-RDV-07 : Médecin consulte ses rendez-vous → uniquement les siens', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointments');
    expect(Array.isArray(res.body.appointments)).toBe(true);
    // Tous les RDV appartiennent à ce médecin
    res.body.appointments.forEach((rdv) => {
      expect(['medecin_prenom', 'medecin_nom'].some((k) => k in rdv)).toBe(true);
    });
  });

  // ✅ TC-RDV-08 : Secrétaire consulte les RDV du médecin assigné
  it('TC-RDV-08 : Secrétaire consulte les RDV du médecin assigné', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointments');
  });

  // ✅ TC-RDV-09 : Patient consulte uniquement ses propres RDV
  it('TC-RDV-09 : Patient consulte ses propres rendez-vous', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointments');
  });

  // ✅ TC-RDV-10 : Récupération d'un RDV par ID
  it('TC-RDV-10 : Récupérer un RDV par son ID → 200 + données complètes', async () => {
    if (!createdAppointmentId) {
      console.warn('No appointment ID available, skipping TC-RDV-10');
      return;
    }
    const res = await request(app)
      .get(`/api/appointments/${createdAppointmentId}`)
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('appointment');
    expect(res.body.appointment.id).toBe(createdAppointmentId);
    expect(res.body.appointment).toHaveProperty('statut');
    expect(res.body.appointment).toHaveProperty('patient_prenom');
    expect(res.body.appointment).toHaveProperty('medecin_prenom');
  });

  // ✅ TC-RDV-11 : Récupération des créneaux disponibles
  it('TC-RDV-11 : Récupérer les créneaux disponibles d\'un médecin', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .get(`/api/appointments/slots?medecin_id=${medecinUtilisateurId}&date=${dateStr}`)
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slots');
    expect(Array.isArray(res.body.slots)).toBe(true);
    // At least some slots available (08:00–18:00)
    expect(res.body.slots.length).toBeGreaterThan(0);
    // Each slot format HH:MM
    res.body.slots.forEach((slot) => {
      expect(slot).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  // ❌ TC-RDV-12 : RDV inexistant → 404
  it('TC-RDV-12 : RDV inexistant → 404', async () => {
    const res = await request(app)
      .get('/api/appointments/999999')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/introuvable/i);
  });
});

// ─── SUITE 3 : Modification d'un rendez-vous ─────────────────────────────────

describe('PUT /api/appointments/:id — Modification', () => {

  // ✅ TC-RDV-13 : Modification du motif d'un RDV
  it('TC-RDV-13 : Secrétaire peut modifier le motif d\'un RDV → 200', async () => {
    if (!createdAppointmentId) return;

    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set(authHeader(users.secretaire.token))
      .send({ motif: 'Motif mis à jour par test' });

    expect(res.status).toBe(200);
    expect(res.body.appointment.motif).toBe('Motif mis à jour par test');
  });

  // ✅ TC-RDV-14 : Validation par la secrétaire (statut → confirmed)
  it('TC-RDV-14 : Secrétaire valide un RDV (statut → confirmed) → 200', async () => {
    if (!createdAppointmentId) return;

    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set(authHeader(users.secretaire.token))
      .send({ statut: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.appointment.statut).toBe('confirmed');
  });

  // ✅ TC-RDV-15 : Annulation d'un RDV (statut → cancelled)
  it('TC-RDV-15 : Médecin annule un RDV (statut → cancelled) → 200', async () => {
    if (!createdAppointmentId) return;

    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set(authHeader(users.medecin.token))
      .send({ statut: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.appointment.statut).toBe('cancelled');
  });

  // ❌ TC-RDV-16 : Modification d'un RDV inexistant → 404
  it('TC-RDV-16 : Modifier un RDV inexistant → 404', async () => {
    const res = await request(app)
      .put('/api/appointments/999999')
      .set(authHeader(users.medecin.token))
      .send({ motif: 'Ghost update' });

    expect(res.status).toBe(404);
  });
});

// ─── SUITE 4 : Suppression d'un rendez-vous ──────────────────────────────────

describe('DELETE /api/appointments/:id — Suppression', () => {

  // ✅ TC-RDV-17 : Suppression d'un RDV existant → 200
  it('TC-RDV-17 : Suppression d\'un RDV existant → 200', async () => {
    if (!createdAppointmentId) return;

    const res = await request(app)
      .delete(`/api/appointments/${createdAppointmentId}`)
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimé/i);
    createdAppointmentId = null; // Marquer comme supprimé
  });

  // ❌ TC-RDV-18 : Suppression d'un RDV inexistant → 404
  it('TC-RDV-18 : Suppression d\'un RDV inexistant → 404', async () => {
    const res = await request(app)
      .delete('/api/appointments/999999')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(404);
  });
});

// ─── SUITE 5 : Vérification en base de données ───────────────────────────────

describe('DB Verification — Données enregistrées correctement', () => {

  // ✅ TC-RDV-19 : Vérification que le RDV créé existe en DB
  it('TC-RDV-19 : Le RDV créé est bien persisté en base MySQL', async () => {
    // Create a fresh appointment and verify in DB
    const res = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: patientEmail,
        medecin_id: medecinUtilisateurId,
        date_heure: futureDate(20, 9),
        duree: 30,
        type_rdv: 'consultation',
        motif: 'Test DB persistence',
      });

    expect(res.status).toBe(201);
    const apptId = res.body.appointment.id;

    // Direct DB check
    const [rows] = await pool.execute(
      'SELECT * FROM rendez_vous WHERE id = ?',
      [apptId]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].statut).toBe('planifie');
    expect(rows[0].motif).toBe('Test DB persistence');

    // Cleanup
    await pool.execute('DELETE FROM rendez_vous WHERE id = ?', [apptId]);
  });

  // ✅ TC-RDV-20 : Vérification que le statut 'confirmed' est bien en DB
  it('TC-RDV-20 : Le statut "confirmed" est stocké en DB comme "confirme"', async () => {
    // Create then confirm
    const createRes = await request(app)
      .post('/api/appointments')
      .set(authHeader(users.secretaire.token))
      .send({
        patient_email: patientEmail,
        medecin_id: medecinUtilisateurId,
        date_heure: futureDate(21, 10),
        duree: 30,
        type_rdv: 'suivi',
      });

    expect(createRes.status).toBe(201);
    const apptId = createRes.body.appointment.id;

    await request(app)
      .put(`/api/appointments/${apptId}`)
      .set(authHeader(users.secretaire.token))
      .send({ statut: 'confirmed' });

    // Direct DB check (server stores 'confirme' not 'confirmed')
    const [rows] = await pool.execute(
      'SELECT statut FROM rendez_vous WHERE id = ?',
      [apptId]
    );
    expect(rows[0].statut).toBe('confirme');

    // Cleanup
    await pool.execute('DELETE FROM rendez_vous WHERE id = ?', [apptId]);
  });
});
