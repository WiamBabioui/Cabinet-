import pool from '../config/db.mysql.js';

/**
 * Fetch all permissions associated with a role.
 */
export const getPermissionsForRole = async (role) => {
  const [rows] = await pool.execute(
    `SELECT p.name FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role = ?`,
    [role]
  );
  return rows.map(r => r.name);
};

/**
 * Middleware: Requires the user to have the Admin role.
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non autorisé — token manquant ou invalide' });
  }
  if (req.user.role?.toLowerCase() === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Accès refusé — Rôle Administrateur requis.' 
  });
};

/**
 * Middleware: Requires the user to have a specific role or be an admin.
 */
export const hasRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  const currentRole = req.user.role?.toLowerCase().trim();
  if (currentRole === 'admin' || roles.map(r => r.toLowerCase().trim()).includes(currentRole)) {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: `Accès refusé — rôle(s) requis : ${roles.join(', ')}` 
  });
};

/**
 * Middleware: Requires the user to have a specific permission or be an admin.
 */
export const hasPermission = (permission) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    if (req.user.role?.toLowerCase() === 'admin') {
      return next();
    }

    const userPerms = await getPermissionsForRole(req.user.role);
    if (userPerms.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Vous ne disposez pas des permissions requises pour effectuer cette action.' 
    });
  } catch (err) {
    console.error('RBAC hasPermission error:', err);
    return res.status(500).json({ message: 'Erreur d\'autorisation' });
  }
};

/**
 * Middleware: Requires the user to have at least one of the specified permissions or be an admin.
 */
export const hasAnyPermission = (...permissions) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    if (req.user.role?.toLowerCase() === 'admin') {
      return next();
    }

    const userPerms = await getPermissionsForRole(req.user.role);
    const hasAny = permissions.some(p => userPerms.includes(p));
    if (hasAny) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Vous ne disposez pas des permissions requises pour effectuer cette action.' 
    });
  } catch (err) {
    console.error('RBAC hasAnyPermission error:', err);
    return res.status(500).json({ message: 'Erreur d\'autorisation' });
  }
};

/**
 * Middleware: Requires the user to have all of the specified permissions or be an admin.
 */
export const hasAllPermissions = (...permissions) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    if (req.user.role?.toLowerCase() === 'admin') {
      return next();
    }

    const userPerms = await getPermissionsForRole(req.user.role);
    const hasAll = permissions.every(p => userPerms.includes(p));
    if (hasAll) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Vous ne disposez pas des permissions requises pour effectuer cette action.' 
    });
  } catch (err) {
    console.error('RBAC hasAllPermissions error:', err);
    return res.status(500).json({ message: 'Erreur d\'autorisation' });
  }
};
