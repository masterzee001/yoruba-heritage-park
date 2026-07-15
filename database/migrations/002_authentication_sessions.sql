CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  csrf_token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idle_expires_at TIMESTAMP NOT NULL,
  absolute_expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  revoked_reason VARCHAR(191) NULL,
  ip_hash CHAR(64) NULL,
  user_agent_hash CHAR(64) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
  KEY idx_auth_sessions_user_active (user_id, revoked_at, idle_expires_at, absolute_expires_at),
  KEY idx_auth_sessions_expiry (revoked_at, idle_expires_at, absolute_expires_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id VARCHAR(64) NOT NULL,
  email_hash CHAR(64) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  outcome ENUM('success', 'invalid_credentials', 'account_locked', 'account_disabled', 'rate_limited') NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(64) NULL,
  metadata_json JSON NOT NULL,
  PRIMARY KEY (id),
  KEY idx_auth_login_attempts_email_time (email_hash, attempted_at),
  KEY idx_auth_login_attempts_ip_time (ip_hash, attempted_at),
  KEY idx_auth_login_attempts_user_time (user_id, attempted_at),
  CONSTRAINT fk_auth_login_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

