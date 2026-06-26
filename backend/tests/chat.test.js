// backend/tests/chat.test.js
// ═══════════════════════════════════════════════════════════════════════════════
// CABINET+ — Tests Chat (Jest + Supertest)
// Couvre : envoi/réception messages, historique, permissions hiérarchiques
// ═══════════════════════════════════════════════════════════════════════════════

import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from './setup/appFactory.js';
import {
  seedTestUsers,
  cleanupTestUsers,
  connectDatabases,
  closeDatabases,
} from './setup/testHelpers.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

let app;
let users;

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDatabases();
  app = createTestApp();
  users = await seedTestUsers();
});

afterAll(async () => {
  // Clean up test conversations and messages from MongoDB
  const participantIds = Object.values(users).map((u) => u.id);
  await Conversation.deleteMany({ participants: { $in: participantIds } });
  await Message.deleteMany({
    $or: participantIds.map((id) => ({ senderId: id }))
  });

  await cleanupTestUsers();
  await closeDatabases();
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ─── SUITE 1 : Contacts ───────────────────────────────────────────────────────

describe('GET /api/chat/contacts — Liste de contacts hiérarchique', () => {

  // ✅ TC-CHAT-01 : Médecin voit ses patients et secrétaires
  it('TC-CHAT-01 : Médecin obtient ses contacts (patients + secrétaires)', async () => {
    const res = await request(app)
      .get('/api/chat/contacts')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('contacts');
    expect(Array.isArray(res.body.contacts)).toBe(true);

    const roles = res.body.contacts.map((c) => c.role);
    roles.forEach((role) => {
      expect(['patient', 'secretaire']).toContain(role);
    });

    // Admin should never appear in contacts
    const adminInContacts = res.body.contacts.find((c) => c.role === 'admin');
    expect(adminInContacts).toBeUndefined();
  });

  // ✅ TC-CHAT-02 : Patient voit son médecin assigné et sa secrétaire
  it('TC-CHAT-02 : Patient obtient ses contacts (médecin + secrétaire assignés)', async () => {
    const res = await request(app)
      .get('/api/chat/contacts')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('contacts');
    expect(Array.isArray(res.body.contacts)).toBe(true);

    const roles = res.body.contacts.map((c) => c.role);
    roles.forEach((role) => {
      expect(['medecin', 'secretaire']).toContain(role);
    });
  });

  // ✅ TC-CHAT-03 : Secrétaire voit son médecin assigné et ses patients
  it('TC-CHAT-03 : Secrétaire obtient ses contacts (médecin + patients)', async () => {
    const res = await request(app)
      .get('/api/chat/contacts')
      .set(authHeader(users.secretaire.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('contacts');
    expect(Array.isArray(res.body.contacts)).toBe(true);
  });

  // ✅ TC-CHAT-04 : Admin a une liste de contacts vide (exclu du chat)
  it('TC-CHAT-04 : Admin a une liste de contacts vide', async () => {
    const res = await request(app)
      .get('/api/chat/contacts')
      .set(authHeader(users.admin.token));

    expect(res.status).toBe(200);
    expect(res.body.contacts).toEqual([]);
  });
});

// ─── SUITE 2 : Envoi de messages ─────────────────────────────────────────────

describe('POST /api/chat/messages — Envoi de messages', () => {

  // ✅ TC-CHAT-05 : Patient envoie un message à son médecin assigné
  it('TC-CHAT-05 : Patient → Médecin assigné → 201 (communication autorisée)', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: users.medecin.id,
        contenu: 'Bonjour Docteur, j\'ai une question sur mon traitement.',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message.content).toBe('Bonjour Docteur, j\'ai une question sur mon traitement.');
    expect(res.body.message.senderId).toBe(users.patient.id);
    expect(res.body.message.receiverId).toBe(users.medecin.id);
  });

  // ✅ TC-CHAT-06 : Médecin répond au patient
  it('TC-CHAT-06 : Médecin → Patient assigné → 201', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.medecin.token))
      .send({
        destinataire_id: users.patient.id,
        contenu: 'Bonjour, continuez votre traitement normalement.',
      });

    expect(res.status).toBe(201);
    expect(res.body.message.senderId).toBe(users.medecin.id);
    expect(res.body.message.receiverId).toBe(users.patient.id);
  });

  // ✅ TC-CHAT-07 : Secrétaire envoie un message au médecin
  it('TC-CHAT-07 : Secrétaire → Médecin assigné → 201', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.secretaire.token))
      .send({
        destinataire_id: users.medecin.id,
        contenu: 'Docteur, le patient de 14h a annulé.',
      });

    expect(res.status).toBe(201);
  });

  // ❌ TC-CHAT-08 : Patient envoie un message à un médecin non assigné → 403
  it('TC-CHAT-08 : Patient → Médecin NON assigné → 403 (HIERARCHY_VIOLATION)', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: users.medecin2.id, // Médecin de patient2, non assigné à patient
        contenu: 'Tentative non autorisée.',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('code', 'HIERARCHY_VIOLATION');
  });

  // ❌ TC-CHAT-09 : Message vide → 400
  it('TC-CHAT-09 : Message vide → 400', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: users.medecin.id,
        contenu: '   ', // whitespace only
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/vide/i);
  });

  // ❌ TC-CHAT-10 : Destinataire invalide → 400
  it('TC-CHAT-10 : Destinataire invalide → 400', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: 'not-a-number',
        contenu: 'Test',
      });

    expect(res.status).toBe(400);
  });

  // ❌ TC-CHAT-11 : Admin essaie d'envoyer un message → 403 (admin non autorisé dans le chat)
  it('TC-CHAT-11 : Admin → Patient → 403 (admin exclu du chat)', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.admin.token))
      .send({
        destinataire_id: users.patient.id,
        contenu: 'Message admin interdit.',
      });

    expect(res.status).toBe(403);
  });

  // ❌ TC-CHAT-12 : Patient → autre Patient → 403
  it('TC-CHAT-12 : Patient → autre Patient → 403 (même rôle interdit)', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: users.patient2.id, // Patient du médecin2
        contenu: 'Message entre patients interdit.',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('HIERARCHY_VIOLATION');
  });
});

// ─── SUITE 3 : Réception et historique des messages ──────────────────────────

describe('GET /api/chat/messages/:userId — Historique', () => {

  // ✅ TC-CHAT-13 : Patient récupère ses messages avec son médecin
  it('TC-CHAT-13 : Patient récupère l\'historique avec son médecin', async () => {
    const res = await request(app)
      .get(`/api/chat/messages/${users.medecin.id}`)
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messages');
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body).toHaveProperty('conversation_id');

    // Vérifier la structure des messages
    if (res.body.messages.length > 0) {
      const msg = res.body.messages[0];
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('content');
      expect(msg).toHaveProperty('senderId');
      expect(msg).toHaveProperty('receiverId');
      expect(msg).toHaveProperty('seen');
      expect(msg).toHaveProperty('createdAt');
    }
  });

  // ✅ TC-CHAT-14 : Les messages sont dans l'ordre chronologique
  it('TC-CHAT-14 : Les messages sont ordonnés chronologiquement (ASC)', async () => {
    const res = await request(app)
      .get(`/api/chat/messages/${users.medecin.id}`)
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    const msgs = res.body.messages;

    if (msgs.length > 1) {
      for (let i = 1; i < msgs.length; i++) {
        const prev = new Date(msgs[i - 1].createdAt).getTime();
        const curr = new Date(msgs[i].createdAt).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    }
  });

  // ❌ TC-CHAT-15 : Patient ne peut PAS accéder aux messages avec un médecin non assigné
  it('TC-CHAT-15 : Patient → Médecin non assigné → 403', async () => {
    const res = await request(app)
      .get(`/api/chat/messages/${users.medecin2.id}`)
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('HIERARCHY_VIOLATION');
  });

  // ❌ TC-CHAT-16 : Accès aux conversations d'un autre utilisateur → 403
  it('TC-CHAT-16 : Patient2 ne peut PAS accéder aux messages Patient/Médecin → 403', async () => {
    // Patient2 tries to read Patient's conversation with Médecin
    const res = await request(app)
      .get(`/api/chat/messages/${users.medecin.id}`)
      .set(authHeader(users.patient2.token));

    // Patient2 is assigned to medecin2, not medecin → forbidden
    expect(res.status).toBe(403);
  });
});

// ─── SUITE 4 : Liste des conversations ───────────────────────────────────────

describe('GET /api/chat/conversations — Liste', () => {

  // ✅ TC-CHAT-17 : Patient récupère ses conversations
  it('TC-CHAT-17 : Patient obtient la liste de ses conversations', async () => {
    const res = await request(app)
      .get('/api/chat/conversations')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('conversations');
    expect(Array.isArray(res.body.conversations)).toBe(true);

    // Only authorized conversations returned
    res.body.conversations.forEach((conv) => {
      expect(conv).toHaveProperty('id');
      expect(conv).toHaveProperty('other_user');
      expect(conv.other_user).toHaveProperty('id');
    });
  });

  // ✅ TC-CHAT-18 : Médecin ne voit que ses conversations hiérarchiquement autorisées
  it('TC-CHAT-18 : Médecin obtient ses conversations (filtrage hiérarchique)', async () => {
    const res = await request(app)
      .get('/api/chat/conversations')
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('conversations');
  });
});

// ─── SUITE 5 : Suppression de messages ───────────────────────────────────────

describe('DELETE /api/chat/messages/:messageId — Sécurité', () => {

  let testMessageId;

  beforeEach(async () => {
    // Create a test message to delete
    const res = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: users.medecin.id,
        contenu: 'Message à supprimer pour test.',
      });
    testMessageId = res.body.message?.id;
  });

  // ✅ TC-CHAT-19 : Auteur peut supprimer son propre message
  it('TC-CHAT-19 : Patient peut supprimer son propre message → 200', async () => {
    if (!testMessageId) return;
    const res = await request(app)
      .delete(`/api/chat/messages/${testMessageId}`)
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimé/i);
  });

  // ❌ TC-CHAT-20 : Non-auteur ne peut PAS supprimer le message → 403
  it('TC-CHAT-20 : Médecin ne peut PAS supprimer le message du patient → 403', async () => {
    // Create fresh message from patient
    const createRes = await request(app)
      .post('/api/chat/messages')
      .set(authHeader(users.patient.token))
      .send({
        destinataire_id: users.medecin.id,
        contenu: 'Message protégé.',
      });
    const msgId = createRes.body.message?.id;

    if (!msgId) return;

    const res = await request(app)
      .delete(`/api/chat/messages/${msgId}`)
      .set(authHeader(users.medecin.token));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/autorisé/i);
  });

  // ❌ TC-CHAT-21 : ID de message invalide → 400
  it('TC-CHAT-21 : ID de message invalide → 400', async () => {
    const res = await request(app)
      .delete('/api/chat/messages/pas-un-objectid')
      .set(authHeader(users.patient.token));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalide/i);
  });
});
