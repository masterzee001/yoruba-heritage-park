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
