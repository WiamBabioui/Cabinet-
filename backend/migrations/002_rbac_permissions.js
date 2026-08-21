import pool from '../config/db.mysql.js';

const run = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Starting migration: 002_rbac_permissions');

    // 1. Create permissions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Table permissions created or already exists');

    // 2. Create role_permissions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role ENUM('admin', 'medecin', 'secretaire', 'patient') NOT NULL,
        permission_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (role, permission_id),
        CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id) 
          REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✅ Table role_permissions created or already exists');

    // 3. Define initial permissions
    const permissions = [
      // Users
      { name: 'users.view', resource: 'users', action: 'view', description: 'Voir les utilisateurs' },
      { name: 'users.create', resource: 'users', action: 'create', description: 'Créer des utilisateurs' },
      { name: 'users.update', resource: 'users', action: 'update', description: 'Modifier des utilisateurs' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Supprimer des utilisateurs' },
      { name: 'users.manage', resource: 'users', action: 'manage', description: 'Gérer complètement les utilisateurs' },
      
      // Roles
      { name: 'roles.view', resource: 'roles', action: 'view', description: 'Voir les rôles' },
      { name: 'roles.create', resource: 'roles', action: 'create', description: 'Créer des rôles' },
      { name: 'roles.update', resource: 'roles', action: 'update', description: 'Modifier des rôles' },
      { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Supprimer des rôles' },
      { name: 'roles.manage', resource: 'roles', action: 'manage', description: 'Gérer complètement les rôles' },
      
      // Permissions
      { name: 'permissions.view', resource: 'permissions', action: 'view', description: 'Voir les permissions' },
      { name: 'permissions.assign', resource: 'permissions', action: 'assign', description: 'Attribuer des permissions' },
      
      // Settings
      { name: 'settings.view', resource: 'settings', action: 'view', description: 'Voir les paramètres' },
      { name: 'settings.update', resource: 'settings', action: 'update', description: 'Modifier les paramètres' },
      
      // Audit Logs
      { name: 'audit_logs.view', resource: 'audit_logs', action: 'view', description: 'Voir les journaux d\'audit' },
      
      // Dashboard
      { name: 'dashboard.view', resource: 'dashboard', action: 'view', description: 'Voir le tableau de bord' },

      // Patients
      { name: 'patients.view', resource: 'patients', action: 'view', description: 'Voir les patients' },
      { name: 'patients.create', resource: 'patients', action: 'create', description: 'Créer des patients' },
      { name: 'patients.update', resource: 'patients', action: 'update', description: 'Modifier des patients' },
      { name: 'patients.delete', resource: 'patients', action: 'delete', description: 'Supprimer des patients' },
      { name: 'patients.manage', resource: 'patients', action: 'manage', description: 'Gérer complètement les patients' },

      // Appointments
      { name: 'appointments.view', resource: 'appointments', action: 'view', description: 'Voir les rendez-vous' },
      { name: 'appointments.create', resource: 'appointments', action: 'create', description: 'Créer des rendez-vous' },
      { name: 'appointments.update', resource: 'appointments', action: 'update', description: 'Modifier des rendez-vous' },
      { name: 'appointments.delete', resource: 'appointments', action: 'delete', description: 'Annuler/supprimer des rendez-vous' },
      { name: 'appointments.manage', resource: 'appointments', action: 'manage', description: 'Gérer complètement les rendez-vous' },

      // Consultations
      { name: 'consultations.view', resource: 'consultations', action: 'view', description: 'Voir les consultations' },
      { name: 'consultations.create', resource: 'consultations', action: 'create', description: 'Créer des consultations' },
      { name: 'consultations.update', resource: 'consultations', action: 'update', description: 'Modifier des consultations' },
      { name: 'consultations.delete', resource: 'consultations', action: 'delete', description: 'Supprimer des consultations' },
      { name: 'consultations.manage', resource: 'consultations', action: 'manage', description: 'Gérer complètement les consultations' },

      // Chat
      { name: 'chat.view', resource: 'chat', action: 'view', description: 'Accéder au chat' },
      { name: 'chat.create', resource: 'chat', action: 'create', description: 'Envoyer des messages' },
      { name: 'chat.delete', resource: 'chat', action: 'delete', description: 'Supprimer des messages' },
      { name: 'chat.manage', resource: 'chat', action: 'manage', description: 'Gérer complètement le chat' },

      // Notifications
      { name: 'notifications.view', resource: 'notifications', action: 'view', description: 'Voir les notifications' },
      { name: 'notifications.create', resource: 'notifications', action: 'create', description: 'Créer des notifications' },
      { name: 'notifications.manage', resource: 'notifications', action: 'manage', description: 'Gérer complètement les notifications' }
    ];

    // Insert permissions one by one or ignore on duplicate
    for (const p of permissions) {
      await conn.execute(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
      `, [p.name, p.resource, p.action, p.description]);
    }
    console.log('  ✅ Seeding permissions registry completed');

    // Retrieve all seeded permissions to map them to roles
    const [permRows] = await conn.execute('SELECT id, name FROM permissions');
    const permMap = {};
    permRows.forEach(row => {
      permMap[row.name] = row.id;
    });

    // Clean existing mappings to prevent constraints issues or duplicate keys during migration run
    await conn.execute('DELETE FROM role_permissions');

    // Default Role Mapping definition
    const roleMappings = {
      admin: Object.keys(permMap), // Admin gets all permissions
      medecin: [
        'dashboard.view',
        'patients.view', 'patients.create', 'patients.update', 'patients.manage',
        'appointments.view', 'appointments.create', 'appointments.update', 'appointments.delete', 'appointments.manage',
        'consultations.view', 'consultations.create', 'consultations.update', 'consultations.manage',
        'chat.view', 'chat.create', 'chat.delete',
        'notifications.view', 'notifications.create'
      ],
      secretaire: [
        'dashboard.view',
        'patients.view', 'patients.create', 'patients.update',
        'appointments.view', 'appointments.create', 'appointments.update', 'appointments.delete', 'appointments.manage',
        'chat.view', 'chat.create',
        'notifications.view', 'notifications.create'
      ],
      patient: [
        'appointments.view', 'appointments.create',
        'chat.view', 'chat.create',
        'notifications.view'
      ]
    };

    for (const [role, permNames] of Object.entries(roleMappings)) {
      for (const name of permNames) {
        const id = permMap[name];
        if (id) {
          await conn.execute(`
            INSERT IGNORE INTO role_permissions (role, permission_id)
            VALUES (?, ?)
          `, [role, id]);
        }
      }
    }
    console.log('  ✅ Role permissions associations seeded successfully');
    console.log('✅ Migration 002 completed successfully\n');

  } catch (err) {
    console.error('❌ Migration 002 failed:', err.message);
    throw err;
  } finally {
    conn.release();
  }
};

// Check if running directly
if (process.argv[1] && process.argv[1].includes('002_rbac_permissions.js')) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
