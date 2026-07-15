CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) NOT NULL,
  title VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  category VARCHAR(100) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  capacity INT UNSIGNED NULL,
  booked_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'cancelled', 'appointment_only') NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  repeating TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_slug (slug),
  KEY idx_events_status_starts (status, starts_at),
  KEY idx_events_deleted_starts (deleted_at, starts_at),
  KEY idx_events_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) NOT NULL,
  reference VARCHAR(64) NOT NULL,
  visitor_name VARCHAR(191) NOT NULL,
  visitor_email VARCHAR(320) NOT NULL,
  booking_type VARCHAR(100) NOT NULL,
  visit_date DATE NOT NULL,
  guests INT UNSIGNED NOT NULL DEFAULT 1,
  amount_minor INT UNSIGNED NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  payment_state ENUM('unpaid', 'pending', 'paid', 'refunded', 'not_applicable') NOT NULL DEFAULT 'unpaid',
  status ENUM('pending', 'awaiting_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refund_requested', 'refunded') NOT NULL DEFAULT 'pending',
  checked_in_at TIMESTAMP NULL,
  source ENUM('website', 'phone', 'walk_in', 'partner') NOT NULL DEFAULT 'website',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_reference (reference),
  KEY idx_bookings_visit_date (visit_date),
  KEY idx_bookings_status (status),
  KEY idx_bookings_email (visitor_email),
  KEY idx_bookings_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_provider_settings (
  id VARCHAR(64) NOT NULL,
  provider_code VARCHAR(80) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  mode ENUM('test', 'live') NOT NULL DEFAULT 'test',
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  public_key VARCHAR(255) NULL,
  secret_reference VARCHAR(191) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  minimum_amount_minor INT UNSIGNED NOT NULL DEFAULT 0,
  configuration_json JSON NOT NULL,
  updated_by_user_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_provider_settings_code (provider_code),
  KEY idx_payment_provider_settings_enabled (enabled),
  KEY idx_payment_provider_settings_updated_by (updated_by_user_id),
  CONSTRAINT fk_payment_provider_settings_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donation_campaigns (
  id VARCHAR(64) NOT NULL,
  campaign_code VARCHAR(100) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status ENUM('draft', 'active', 'paused', 'archived') NOT NULL DEFAULT 'draft',
  suggested_amounts_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_donation_campaigns_code (campaign_code),
  KEY idx_donation_campaigns_status (status),
  KEY idx_donation_campaigns_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) NOT NULL,
  reference VARCHAR(64) NOT NULL,
  booking_id VARCHAR(64) NULL,
  campaign_id VARCHAR(64) NULL,
  payer_name VARCHAR(191) NOT NULL,
  payer_email VARCHAR(320) NULL,
  amount_minor INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  provider_code VARCHAR(80) NOT NULL DEFAULT 'pending_configuration',
  provider_transaction_reference VARCHAR(191) NULL,
  status ENUM('pending', 'successful', 'failed', 'abandoned', 'reversed', 'refund_pending', 'refunded') NOT NULL DEFAULT 'pending',
  verification_status ENUM('unverified', 'review_required', 'preview_verified', 'not_applicable') NOT NULL DEFAULT 'unverified',
  refund_status ENUM('none', 'review_requested', 'preview_pending', 'preview_refunded') NOT NULL DEFAULT 'none',
  metadata_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_reference (reference),
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_campaign (campaign_id),
  KEY idx_payments_status_created (status, created_at),
  KEY idx_payments_provider (provider_code),
  KEY idx_payments_deleted (deleted_at),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_campaign FOREIGN KEY (campaign_id) REFERENCES donation_campaigns (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permissions (id, permission_code, module_code, action_code, description)
VALUES
  ('perm_events_delete', 'events.delete', 'events', 'delete', 'Soft-delete event records.'),
  ('perm_payments_manage', 'payments.manage', 'payments', 'manage', 'Manage payment provider settings and payment records.')
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
JOIN permissions p ON p.permission_code IN ('payments.manage')
WHERE r.role_code = 'booking_officer';

INSERT INTO events (
  id, title, slug, category, starts_at, ends_at, capacity, booked_count, status, featured, repeating, notes
)
VALUES
  ('evt_past_opening_blessing_2025', 'Opening Blessing and Heritage Preview', 'opening-blessing-heritage-preview-2025', 'Heritage Preview', '2025-09-20 10:00:00', '2025-09-20 13:00:00', NULL, 0, 'published', 1, 0, 'Past event record preserved for administrator history. Public details remain subject to content approval.'),
  ('evt_past_craft_dialogue_2025', 'Craft and Material Culture Dialogue', 'craft-material-culture-dialogue-2025', 'Learning', '2025-11-15 11:00:00', '2025-11-15 14:00:00', NULL, 0, 'published', 0, 0, 'Past event record preserved for administrator history. Public details remain subject to content approval.'),
  ('evt_past_forest_walk_2026', 'Forest Walk and Custodianship Session', 'forest-walk-custodianship-session-2026', 'Nature and Heritage', '2026-02-22 08:30:00', '2026-02-22 11:00:00', NULL, 0, 'published', 0, 0, 'Past event record preserved for administrator history. Public details remain subject to content approval.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  category = VALUES(category),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  capacity = VALUES(capacity),
  booked_count = VALUES(booked_count),
  status = VALUES(status),
  featured = VALUES(featured),
  repeating = VALUES(repeating),
  notes = VALUES(notes);

INSERT INTO payment_provider_settings (
  id, provider_code, display_name, mode, enabled, public_key, secret_reference, currency, minimum_amount_minor, configuration_json
)
VALUES
  ('pay_provider_pending', 'pending_configuration', 'Pending provider configuration', 'test', 0, NULL, NULL, 'NGN', 0, JSON_OBJECT('configuredBy', 'master_admin', 'liveCaptureEnabled', false))
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  mode = VALUES(mode),
  enabled = VALUES(enabled),
  public_key = VALUES(public_key),
  secret_reference = VALUES(secret_reference),
  currency = VALUES(currency),
  minimum_amount_minor = VALUES(minimum_amount_minor),
  configuration_json = VALUES(configuration_json);

INSERT INTO donation_campaigns (
  id, campaign_code, title, description, status, suggested_amounts_json
)
VALUES
  ('don_general_support', 'general-support', 'General Support', 'Donation campaign foundation. Public launch awaits approved payment provider configuration.', 'draft', JSON_ARRAY())
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  status = VALUES(status),
  suggested_amounts_json = VALUES(suggested_amounts_json);
