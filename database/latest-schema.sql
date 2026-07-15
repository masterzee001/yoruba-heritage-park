CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  migration_name VARCHAR(191) NOT NULL,
  checksum CHAR(64) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schema_migrations_name (migration_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL,
  email VARCHAR(320) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NULL,
  account_status ENUM('invited', 'active', 'suspended', 'disabled', 'archived') NOT NULL DEFAULT 'invited',
  email_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  failed_login_count INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  archived_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_account_status (account_status),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(64) NOT NULL,
  role_code VARCHAR(100) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  is_system_role TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_role_code (role_code),
  KEY idx_roles_display_name (display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(64) NOT NULL,
  permission_code VARCHAR(150) NOT NULL,
  module_code VARCHAR(80) NOT NULL,
  action_code VARCHAR(80) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_permission_code (permission_code),
  KEY idx_permissions_module_action (module_code, action_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR(64) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by_user_id VARCHAR(64) NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role_id (role_id),
  KEY idx_user_roles_assigned_by (assigned_by_user_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(64) NOT NULL,
  permission_id VARCHAR(64) NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_permission_id (permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(64) NOT NULL,
  setting_group VARCHAR(100) NOT NULL,
  setting_key VARCHAR(150) NOT NULL,
  value_json JSON NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  updated_by_user_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_settings_group_key (setting_group, setting_key),
  KEY idx_app_settings_group (setting_group),
  KEY idx_app_settings_updated_by (updated_by_user_id),
  CONSTRAINT fk_app_settings_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) NOT NULL,
  actor_user_id VARCHAR(64) NULL,
  action_code VARCHAR(100) NOT NULL,
  module_code VARCHAR(80) NOT NULL,
  record_type VARCHAR(100) NULL,
  record_id VARCHAR(100) NULL,
  outcome ENUM('success', 'denied', 'failed', 'informational') NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  metadata_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_created_at (created_at),
  KEY idx_audit_logs_actor (actor_user_id, created_at),
  KEY idx_audit_logs_module (module_code, created_at),
  KEY idx_audit_logs_record (record_type, record_id),
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id, role_code, display_name, description, is_system_role)
VALUES
  ('role_super_administrator', 'super_administrator', 'Super Administrator', 'Provisional full administrative role for future server-side enforcement.', 1),
  ('role_content_manager', 'content_manager', 'Content Manager', 'Provisional content and publishing role.', 1),
  ('role_booking_officer', 'booking_officer', 'Booking Officer', 'Provisional booking and visitor operations role.', 1),
  ('role_safety_officer', 'safety_officer', 'Safety Officer', 'Provisional safety operations role.', 1),
  ('role_viewer_auditor', 'viewer_auditor', 'Viewer or Auditor', 'Provisional read-only audit and review role.', 1)
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  description = VALUES(description),
  is_system_role = VALUES(is_system_role);

INSERT INTO permissions (id, permission_code, module_code, action_code, description)
VALUES
  ('perm_dashboard_view', 'dashboard.view', 'dashboard', 'view', 'View administrator dashboard summaries.'),
  ('perm_content_view', 'content.view', 'content', 'view', 'View content records.'),
  ('perm_content_edit', 'content.edit', 'content', 'edit', 'Edit draft content records.'),
  ('perm_content_publish', 'content.publish', 'content', 'publish', 'Publish approved content.'),
  ('perm_bookings_view', 'bookings.view', 'bookings', 'view', 'View booking records.'),
  ('perm_bookings_manage', 'bookings.manage', 'bookings', 'manage', 'Manage booking records.'),
  ('perm_payments_view', 'payments.view', 'payments', 'view', 'View payment records.'),
  ('perm_safety_view', 'safety.view', 'safety', 'view', 'View safety records.'),
  ('perm_safety_acknowledge', 'safety.acknowledge', 'safety', 'acknowledge', 'Acknowledge safety alerts.'),
  ('perm_safety_resolve', 'safety.resolve', 'safety', 'resolve', 'Resolve safety records.'),
  ('perm_users_manage', 'users.manage', 'users', 'manage', 'Manage administrator users.'),
  ('perm_roles_manage', 'roles.manage', 'roles', 'manage', 'Manage roles and permissions.'),
  ('perm_settings_manage', 'settings.manage', 'settings', 'manage', 'Manage application settings.'),
  ('perm_audit_view', 'audit.view', 'audit', 'view', 'View audit logs.')
ON DUPLICATE KEY UPDATE
  module_code = VALUES(module_code),
  action_code = VALUES(action_code),
  description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.role_code = 'super_administrator';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'dashboard.view',
  'content.view',
  'content.edit',
  'content.publish',
  'audit.view'
)
WHERE r.role_code = 'content_manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'dashboard.view',
  'bookings.view',
  'bookings.manage',
  'payments.view',
  'audit.view'
)
WHERE r.role_code = 'booking_officer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'dashboard.view',
  'safety.view',
  'safety.acknowledge',
  'safety.resolve',
  'audit.view'
)
WHERE r.role_code = 'safety_officer';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_code IN (
  'dashboard.view',
  'content.view',
  'bookings.view',
  'payments.view',
  'safety.view',
  'audit.view'
)
WHERE r.role_code = 'viewer_auditor';
