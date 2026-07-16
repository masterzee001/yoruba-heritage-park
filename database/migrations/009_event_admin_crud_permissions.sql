INSERT INTO permissions (id, permission_code, module_code, action_code, description)
VALUES
  ('perm_events_create', 'events.create', 'events', 'create', 'Create event records.'),
  ('perm_events_edit', 'events.edit', 'events', 'edit', 'Edit and restore event records.')
ON DUPLICATE KEY UPDATE
  module_code = VALUES(module_code),
  action_code = VALUES(action_code),
  description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_code IN ('events.create', 'events.edit', 'events.delete')
WHERE r.role_code IN ('super_administrator', 'content_manager');
