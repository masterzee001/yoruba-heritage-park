INSERT INTO permissions (id, permission_code, module_code, action_code, description)
VALUES
  ('perm_admin_access', 'admin.access', 'admin', 'access', 'Access the administrator portal.'),
  ('perm_events_view', 'events.view', 'events', 'view', 'View event records.'),
  ('perm_enquiries_view', 'enquiries.view', 'enquiries', 'view', 'View enquiry and specialist service records.'),
  ('perm_appointments_view', 'appointments.view', 'appointments', 'view', 'View appointment records.')
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
  'admin.access',
  'events.view',
  'enquiries.view',
  'appointments.view'
)
WHERE r.role_code IN ('content_manager', 'booking_officer', 'safety_officer', 'viewer_auditor');

