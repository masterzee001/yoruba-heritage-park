INSERT INTO payment_provider_settings (
  id, provider_code, display_name, mode, enabled, public_key, secret_reference, currency, minimum_amount_minor, configuration_json
)
VALUES
  ('pay_provider_paystack', 'paystack', 'Paystack', 'test', 0, NULL, 'PAYSTACK_SECRET_KEY', 'NGN', 0, JSON_OBJECT('adapter', 'paystack', 'configuredBy', 'master_admin', 'liveCaptureEnabled', false)),
  ('pay_provider_stripe', 'stripe', 'Stripe', 'test', 0, NULL, 'STRIPE_SECRET_KEY', 'USD', 0, JSON_OBJECT('adapter', 'stripe', 'configuredBy', 'master_admin', 'liveCaptureEnabled', false))
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  mode = VALUES(mode),
  enabled = VALUES(enabled),
  public_key = VALUES(public_key),
  secret_reference = VALUES(secret_reference),
  currency = VALUES(currency),
  minimum_amount_minor = VALUES(minimum_amount_minor),
  configuration_json = VALUES(configuration_json);
