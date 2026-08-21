import bcrypt from 'bcryptjs';
import pool from '../config/db.mysql.js';
import { logAudit } from '../utils/auditLog.js';

// Helper to check if a user is the last active admin
const isLastActiveAdmin = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM utilisateurs 
     WHERE role = 'admin' AND actif = 1 AND deleted_at IS NULL`
  );
  const adminCount = rows[0]?.count || 0;
  
  if (adminCount <= 1) {
    const [userRows] = await pool.execute(
      `SELECT role, actif FROM utilisateurs WHERE id = ?`,
      [Number(userId)]
    );
    if (userRows.length > 0 && userRows[0].role === 'admin' && userRows[0].actif === 1) {
      return true;
    }
  }
  return false;
};

// ─── USER CRUD ────────────────────────────────────────────────────────────────

// GET /api/admin/users
export const getAdminUsers = async (req, res) => {
  const { search = '', role = '', status = '', page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = `
      FROM utilisateurs u
      LEFT JOIN utilisateurs d ON u.assigned_doctor_id = d.id
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (u.prenom LIKE ? OR u.nom LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status !== '') {
      query += ` AND u.actif = ?`;
      params.push(Number(status));
    }

    // Get count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total ${query}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get data
    const selectQuery = `
      SELECT u.id, u.uuid, u.email, u.role, u.prenom, u.nom, u.telephone, u.photo_url, u.actif, u.created_at,
             u.assigned_doctor_id, d.prenom as doctor_prenom, d.nom as doctor_nom
      ${query}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination params as numbers (must cast properly for prepared statements limit/offset)
    const [users] = await pool.execute(selectQuery, [...params, String(limit), String(offset)]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('getAdminUsers error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs' });
  }
};

// GET /api/admin/users/:id
export const getAdminUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.uuid, u.email, u.role, u.prenom, u.nom, u.telephone, u.photo_url, u.actif, u.created_at,
              u.assigned_doctor_id,
              m.id as medecin_id, m.specialite_id, m.num_ordre, m.titre, m.consultation_tarif, m.consultation_duree,
              d.prenom as doctor_prenom, d.nom as doctor_nom
       FROM utilisateurs u
       LEFT JOIN medecins m ON m.utilisateur_id = u.id
       LEFT JOIN utilisateurs d ON u.assigned_doctor_id = d.id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getAdminUserById error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/admin/users
export const createAdminUser = async (req, res) => {
  const {
    prenom, nom, email, mot_de_passe, role, telephone,
    specialite_id, num_ordre, assigned_doctor_id
  } = req.body;

  const rolesAllowed = ['admin', 'medecin', 'secretaire', 'patient'];
  if (!rolesAllowed.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM utilisateurs WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hash = await bcrypt.hash(mot_de_passe || 'Welcome123!', 12);

    const [result] = await pool.execute(
      `INSERT INTO utilisateurs (email, mot_de_passe_hash, role, prenom, nom, telephone, assigned_doctor_id, actif, email_verifie)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        email,
        hash,
        role,
        prenom,
        nom,
        telephone || null,
        assigned_doctor_id ? Number(assigned_doctor_id) : null
      ]
    );

    const newUserId = result.insertId;

    if (role === 'medecin') {
      await pool.execute(
        `INSERT INTO medecins (utilisateur_id, specialite_id, num_ordre)
         VALUES (?, ?, ?)`,
        [newUserId, specialite_id ? Number(specialite_id) : 1, num_ordre || 'ORDRE-TEMP']
      );
    }

    await logAudit(req, {
      action: 'USER_CREATED',
      entite: 'utilisateurs',
      entite_id: newUserId,
      nouvelles_valeurs: { email, role, prenom, nom }
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: newUserId, email, role, prenom, nom }
    });
  } catch (err) {
    console.error('createAdminUser error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la création' });
  }
};

// PUT /api/admin/users/:id
export const updateAdminUser = async (req, res) => {
  const { id } = req.params;
  const { prenom, nom, email, role, telephone, actif, specialite_id, num_ordre, assigned_doctor_id } = req.body;

  try {
    const [currentRows] = await pool.execute(
      'SELECT id, prenom, nom, email, role, telephone, actif, assigned_doctor_id FROM utilisateurs WHERE id = ? AND deleted_at IS NULL',
      [Number(id)]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const current = currentRows[0];

    // Prevent privilege/active state changes if this is the last admin
    if (current.role === 'admin' && role !== 'admin') {
      const isLast = await isLastActiveAdmin(id);
      if (isLast) {
        return res.status(400).json({ message: 'Impossible de changer le rôle : cet utilisateur est le dernier administrateur actif.' });
      }
    }

    if (current.actif === 1 && Number(actif) === 0) {
      const isLast = await isLastActiveAdmin(id);
      if (isLast) {
        return res.status(400).json({ message: 'Impossible de désactiver : cet utilisateur est le dernier administrateur actif.' });
      }
    }

    // Update utilisateur
    await pool.execute(
      `UPDATE utilisateurs 
       SET prenom = ?, nom = ?, email = ?, role = ?, telephone = ?, actif = ?, assigned_doctor_id = ?
       WHERE id = ?`,
      [
        prenom,
        nom,
        email,
        role,
        telephone || null,
        Number(actif),
        assigned_doctor_id ? Number(assigned_doctor_id) : null,
        Number(id)
      ]
    );

    // Update or insert medecin details if role is/was medecin
    if (role === 'medecin') {
      const [medRows] = await pool.execute('SELECT id FROM medecins WHERE utilisateur_id = ?', [Number(id)]);
      if (medRows.length > 0) {
        await pool.execute(
          `UPDATE medecins SET specialite_id = ?, num_ordre = ? WHERE utilisateur_id = ?`,
          [Number(specialite_id || 1), num_ordre || 'ORDRE-TEMP', Number(id)]
        );
      } else {
        await pool.execute(
          `INSERT INTO medecins (utilisateur_id, specialite_id, num_ordre) VALUES (?, ?, ?)`,
          [Number(id), Number(specialite_id || 1), num_ordre || 'ORDRE-TEMP']
        );
      }
    }

    await logAudit(req, {
      action: 'USER_UPDATED',
      entite: 'utilisateurs',
      entite_id: Number(id),
      anciennes_valeurs: current,
      nouvelles_valeurs: { prenom, nom, email, role, telephone, actif }
    });

    res.json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (err) {
    console.error('updateAdminUser error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};

// DELETE /api/admin/users/:id
export const deleteAdminUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === Number(id)) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }

  try {
    const [current] = await pool.execute('SELECT role, actif FROM utilisateurs WHERE id = ?', [Number(id)]);
    if (current.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (current[0].role === 'admin') {
      const isLast = await isLastActiveAdmin(id);
      if (isLast) {
        return res.status(400).json({ message: 'Impossible de supprimer : cet utilisateur est le dernier administrateur actif.' });
      }
    }

    await pool.execute(
      'UPDATE utilisateurs SET deleted_at = NOW(), actif = 0 WHERE id = ?',
      [Number(id)]
    );

    await logAudit(req, {
      action: 'USER_DELETED',
      entite: 'utilisateurs',
      entite_id: Number(id)
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    console.error('deleteAdminUser error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
};

// PATCH /api/admin/users/:id/toggle
export const toggleAdminUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute('SELECT role, actif FROM utilisateurs WHERE id = ? AND deleted_at IS NULL', [Number(id)]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const user = rows[0];
    const newStatus = user.actif ? 0 : 1;

    if (user.role === 'admin' && newStatus === 0) {
      const isLast = await isLastActiveAdmin(id);
      if (isLast) {
        return res.status(400).json({ message: 'Impossible de désactiver : cet utilisateur est le dernier administrateur actif.' });
      }
    }

    await pool.execute('UPDATE utilisateurs SET actif = ? WHERE id = ?', [newStatus, Number(id)]);

    await logAudit(req, {
      action: newStatus ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      entite: 'utilisateurs',
      entite_id: Number(id)
    });

    res.json({
      message: newStatus ? 'Utilisateur activé' : 'Utilisateur désactivé ou suspendu',
      actif: !!newStatus
    });
  } catch (err) {
    console.error('toggleAdminUserStatus error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la modification du statut' });
  }
};

// PATCH /api/admin/users/:id/role
export const assignRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const rolesAllowed = ['admin', 'medecin', 'secretaire', 'patient'];
  if (!rolesAllowed.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  try {
    const [rows] = await pool.execute('SELECT role, email FROM utilisateurs WHERE id = ? AND deleted_at IS NULL', [Number(id)]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const user = rows[0];

    // Prevent changing role if this is the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const isLast = await isLastActiveAdmin(id);
      if (isLast) {
        return res.status(400).json({ message: 'Impossible de changer le rôle : cet utilisateur est le dernier administrateur actif.' });
      }
    }

    await pool.execute('UPDATE utilisateurs SET role = ? WHERE id = ?', [role, Number(id)]);

    await logAudit(req, {
      action: 'ROLE_ASSIGNED',
      entite: 'utilisateurs',
      entite_id: Number(id),
      anciennes_valeurs: { role: user.role },
      nouvelles_valeurs: { role }
    });

    res.json({ message: 'Rôle mis à jour avec succès' });
  } catch (err) {
    console.error('assignRole error:', err);
    res.status(500).json({ message: 'Erreur serveur lors du changement de rôle' });
  }
};

// POST /api/admin/users/:id/reset-password
export const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { nouveau_mdp } = req.body;

  if (!nouveau_mdp) {
    return res.status(400).json({ message: 'Le nouveau mot de passe est requis.' });
  }

  try {
    const [rows] = await pool.execute('SELECT id FROM utilisateurs WHERE id = ? AND deleted_at IS NULL', [Number(id)]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const hash = await bcrypt.hash(nouveau_mdp, 12);
    await pool.execute('UPDATE utilisateurs SET mot_de_passe_hash = ?, tentatives_connexion = 0, bloque_jusqu_au = NULL WHERE id = ?', [hash, Number(id)]);

    await logAudit(req, {
      action: 'PASSWORD_RESET',
      entite: 'utilisateurs',
      entite_id: Number(id)
    });

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error('resetUserPassword error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation.' });
  }
};


// ─── ROLE & PERMISSION MANAGEMENT ──────────────────────────────────────────

// GET /api/admin/roles
export const getRoles = async (req, res) => {
  try {
    // List roles with user count
    const [rows] = await pool.execute(`
      SELECT role, COUNT(*) as user_count 
      FROM utilisateurs 
      WHERE deleted_at IS NULL 
      GROUP BY role
    `);
    
    // Ensure all 4 default roles are returned
    const rolesList = ['admin', 'medecin', 'secretaire', 'patient'].map(role => {
      const match = rows.find(r => r.role === role);
      return {
        role,
        user_count: match ? match.user_count : 0
      };
    });

    res.json({ roles: rolesList });
  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/admin/roles/:role/permissions
export const getRolePermissions = async (req, res) => {
  const { role } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.resource, p.action, p.description 
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role = ?`,
      [role]
    );

    res.json({ permissions: rows });
  } catch (err) {
    console.error('getRolePermissions error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/admin/roles/:role/permissions
export const updateRolePermissions = async (req, res) => {
  const { role } = req.params;
  const { permissions: permIds } = req.body; // array of permission IDs

  if (role === 'admin') {
    return res.status(400).json({ message: 'Les permissions du rôle admin sont verrouillées et ne peuvent pas être modifiées.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch existing mappings
    const [oldRows] = await conn.execute(
      'SELECT permission_id FROM role_permissions WHERE role = ?',
      [role]
    );
    const oldIds = oldRows.map(r => r.permission_id);

    // Delete existing role permissions
    await conn.execute('DELETE FROM role_permissions WHERE role = ?', [role]);

    // Insert new permissions
    if (Array.isArray(permIds) && permIds.length > 0) {
      for (const pId of permIds) {
        // Validate if permission exists
        const [pExists] = await conn.execute('SELECT id FROM permissions WHERE id = ?', [Number(pId)]);
        if (pExists.length > 0) {
          await conn.execute(
            'INSERT INTO role_permissions (role, permission_id) VALUES (?, ?)',
            [role, Number(pId)]
          );
        }
      }
    }

    await conn.commit();

    await logAudit(req, {
      action: 'ROLE_UPDATED',
      entite: 'roles',
      entite_id: 0,
      anciennes_valeurs: oldIds,
      nouvelles_valeurs: permIds
    });

    res.json({ message: `Permissions du rôle ${role} mises à jour avec succès` });
  } catch (err) {
    await conn.rollback();
    console.error('updateRolePermissions error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour des permissions' });
  } finally {
    conn.release();
  }
};

// GET /api/admin/permissions
export const getPermissions = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, resource, action, description FROM permissions ORDER BY resource, name');
    res.json({ permissions: rows });
  } catch (err) {
    console.error('getPermissions error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

// GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  const { actor = '', action = '', entity = '', startDate = '', endDate = '', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = `
      FROM audit_log a
      LEFT JOIN utilisateurs u ON a.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (actor) {
      query += ` AND (u.prenom LIKE ? OR u.nom LIKE ? OR u.email LIKE ?)`;
      params.push(`%${actor}%`, `%${actor}%`, `%${actor}%`);
    }

    if (action) {
      query += ` AND a.action = ?`;
      params.push(action);
    }

    if (entity) {
      query += ` AND a.entite = ?`;
      params.push(entity);
    }

    if (startDate) {
      query += ` AND a.created_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND a.created_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    // Total Count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total ${query}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get Data
    const selectQuery = `
      SELECT a.id, a.action, a.entite, a.entite_id, a.anciennes_valeurs, a.nouvelles_valeurs, 
             a.adresse_ip, a.user_agent, a.created_at,
             u.prenom as actor_prenom, u.nom as actor_nom, u.email as actor_email, u.role as actor_role
      ${query}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [logs] = await pool.execute(selectQuery, [...params, String(limit), String(offset)]);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des journaux d\'audit' });
  }
};


// ─── ADMIN STATS ──────────────────────────────────────────────────────────────

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    // 1. Total users by role
    const [roleRows] = await pool.execute(`
      SELECT role, COUNT(*) as count 
      FROM utilisateurs 
      WHERE deleted_at IS NULL 
      GROUP BY role
    `);

    // 2. Active vs Inactive
    const [statusRows] = await pool.execute(`
      SELECT actif, COUNT(*) as count 
      FROM utilisateurs 
      WHERE deleted_at IS NULL 
      GROUP BY actif
    `);

    // 3. Total patients
    const [patientRows] = await pool.execute(`
      SELECT COUNT(*) as count FROM patients
    `);

    // 4. Recent audit logs (last 5)
    const [recentLogs] = await pool.execute(`
      SELECT a.id, a.action, a.entite, a.created_at, u.prenom, u.nom
      FROM audit_log a
      LEFT JOIN utilisateurs u ON a.utilisateur_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    res.json({
      roles: roleRows,
      status: statusRows,
      totalPatients: patientRows[0]?.count || 0,
      recentLogs
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
