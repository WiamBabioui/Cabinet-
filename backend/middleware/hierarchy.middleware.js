// backend/middleware/hierarchy.middleware.js
// Enforces the medical cabinet hierarchy:
//   Doctor  → own patients + own secretaries
//   Patient → assigned doctor + secretaries of same doctor
//   Secretary → assigned doctor + patients of same doctor

import pool from '../config/db.mysql.js';

// ─── Core Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the minimal user info needed for hierarchy checks.
 * Cached per request via res.locals when used through middleware.
 */
export const getUserHierarchyInfo = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, role, assigned_doctor_id
     FROM utilisateurs
     WHERE id = ? AND actif = 1 AND deleted_at IS NULL`,
    [Number(userId)]
  );
  return rows[0] || null;
};

/**
 * Returns the assigned doctor's utilisateur_id for a patient or secretary.
 * Returns null if none is assigned.
 * For a doctor, returns their own id.
 */
export const getAssignedDoctorId = async (userId, role) => {
  const r = role?.toLowerCase().trim();
  if (r === 'medecin') return Number(userId);

  const [rows] = await pool.execute(
    `SELECT assigned_doctor_id FROM utilisateurs WHERE id = ? AND actif = 1`,
    [Number(userId)]
  );
  return rows[0]?.assigned_doctor_id ?? null;
};

/**
 * Core permission check.
 * Returns true if user1 is allowed to communicate with user2.
 *
 * Allowed pairs:
 *   doctor   ↔ patient   (patient.assigned_doctor_id === doctor.id)
 *   doctor   ↔ secretary (secretary.assigned_doctor_id === doctor.id)
 *   patient  ↔ doctor    (patient.assigned_doctor_id === doctor.id)
 *   patient  ↔ secretary (both share the same assigned_doctor_id)
 *   secretary↔ doctor    (secretary.assigned_doctor_id === doctor.id)
 *   secretary↔ patient   (both share the same assigned_doctor_id)
 *
 * Forbidden:
 *   doctor   ↔ doctor
 *   patient  ↔ patient
 *   secretary↔ secretary
 *   any      ↔ admin
 *   patient  ↔ unrelated doctor/secretary
 *   secretary↔ unrelated doctor/patient
 *   doctor   ↔ other-doctor's patient/secretary
 */
export const canCommunicate = async (user1Id, user2Id) => {
  const id1 = Number(user1Id);
  const id2 = Number(user2Id);

  if (id1 === id2) return false;
  if (isNaN(id1) || isNaN(id2)) return false;

  // Load both users' hierarchy info in parallel
  const [[u1], [u2]] = await Promise.all([
    pool.execute(
      `SELECT id, role, assigned_doctor_id FROM utilisateurs WHERE id = ? AND actif = 1 AND deleted_at IS NULL`,
      [id1]
    ),
    pool.execute(
      `SELECT id, role, assigned_doctor_id FROM utilisateurs WHERE id = ? AND actif = 1 AND deleted_at IS NULL`,
      [id2]
    ),
  ]);

  const a = u1[0];
  const b = u2[0];

  if (!a || !b) return false;

  const roleA = a.role?.toLowerCase().trim();
  const roleB = b.role?.toLowerCase().trim();

  // Admins cannot participate in chat
  if (roleA === 'admin' || roleB === 'admin') return false;

  // Same-role pairs are forbidden (except handled below)
  if (roleA === roleB) return false;

  // ── Doctor ↔ Patient ──────────────────────────────────────────────────────
  if (roleA === 'medecin' && roleB === 'patient') {
    return b.assigned_doctor_id === a.id;
  }
  if (roleA === 'patient' && roleB === 'medecin') {
    return a.assigned_doctor_id === b.id;
  }

  // ── Doctor ↔ Secretary ────────────────────────────────────────────────────
  if (roleA === 'medecin' && roleB === 'secretaire') {
    return b.assigned_doctor_id === a.id;
  }
  if (roleA === 'secretaire' && roleB === 'medecin') {
    return a.assigned_doctor_id === b.id;
  }

  // ── Patient ↔ Secretary (same doctor) ─────────────────────────────────────
  if (roleA === 'patient' && roleB === 'secretaire') {
    if (!a.assigned_doctor_id || !b.assigned_doctor_id) return false;
    return a.assigned_doctor_id === b.assigned_doctor_id;
  }
  if (roleA === 'secretaire' && roleB === 'patient') {
    if (!a.assigned_doctor_id || !b.assigned_doctor_id) return false;
    return a.assigned_doctor_id === b.assigned_doctor_id;
  }

  return false;
};

// ─── Express Middleware ────────────────────────────────────────────────────────

/**
 * Middleware: validates that the authenticated user can communicate with
 * the user identified by req.params.userId or req.body.destinataire_id / receiverId.
 *
 * Usage:
 *   router.get('/messages/:userId', requireCanCommunicate, getMessages);
 *   router.post('/messages', requireCanCommunicateBody, sendMessage);
 */
export const requireCanCommunicate = async (req, res, next) => {
  try {
    const myId = Number(req.user.id);
    const otherId = Number(req.params.userId);

    if (isNaN(otherId)) {
      return res.status(400).json({ message: 'Utilisateur invalide' });
    }

    const allowed = await canCommunicate(myId, otherId);
    if (!allowed) {
      return res.status(403).json({
        message: 'Communication non autorisée entre ces utilisateurs',
        code: 'HIERARCHY_VIOLATION',
      });
    }
    next();
  } catch (err) {
    console.error('requireCanCommunicate error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification des permissions' });
  }
};

/**
 * Same as above but reads the target from the request body
 * (for POST /chat/messages).
 */
export const requireCanCommunicateBody = async (req, res, next) => {
  try {
    const myId = Number(req.user.id);
    const { destinataire_id, receiverId } = req.body;
    const otherId = Number(destinataire_id ?? receiverId);

    if (isNaN(otherId)) {
      return res.status(400).json({ message: 'Destinataire invalide' });
    }

    const allowed = await canCommunicate(myId, otherId);
    if (!allowed) {
      return res.status(403).json({
        message: 'Communication non autorisée entre ces utilisateurs',
        code: 'HIERARCHY_VIOLATION',
      });
    }
    next();
  } catch (err) {
    console.error('requireCanCommunicateBody error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification des permissions' });
  }
};
