ALTER TABLE bookings
  ADD COLUMN duration_of_stay_days INT UNSIGNED NULL AFTER visit_date,
  ADD COLUMN country_of_origin VARCHAR(100) NULL AFTER visitor_email;

CREATE INDEX idx_bookings_country_of_origin ON bookings (country_of_origin);

INSERT INTO payment_provider_settings (
  id, provider_code, display_name, mode, enabled, public_key, secret_reference, currency, minimum_amount_minor, configuration_json
)
VALUES
  ('pay_provider_paypal', 'paypal', 'PayPal', 'test', 0, NULL, 'PAYPAL_SECRET_KEY', 'NGN', 0, JSON_OBJECT('adapter', 'paypal', 'configuredBy', 'master_admin', 'liveCaptureEnabled', false))
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  mode = VALUES(mode),
  enabled = VALUES(enabled),
  public_key = VALUES(public_key),
  secret_reference = VALUES(secret_reference),
  currency = VALUES(currency),
  minimum_amount_minor = VALUES(minimum_amount_minor),
  configuration_json = VALUES(configuration_json);
