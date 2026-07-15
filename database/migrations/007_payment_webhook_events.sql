CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id VARCHAR(64) NOT NULL,
  provider_code VARCHAR(64) NOT NULL,
  provider_event_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(191) NOT NULL,
  payment_id VARCHAR(64) NULL,
  payment_reference VARCHAR(191) NULL,
  processing_status ENUM('received', 'ignored', 'review_required', 'processed', 'failed') NOT NULL DEFAULT 'received',
  verification_status ENUM('unverified', 'verified', 'failed', 'not_applicable') NOT NULL DEFAULT 'unverified',
  payload_json JSON NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_webhook_provider_event (provider_code, provider_event_id),
  KEY idx_payment_webhook_payment_id (payment_id),
  KEY idx_payment_webhook_reference (payment_reference),
  KEY idx_payment_webhook_processing_status (processing_status),
  CONSTRAINT fk_payment_webhook_events_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
