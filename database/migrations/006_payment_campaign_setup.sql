INSERT INTO donation_campaigns (
  id, campaign_code, title, description, status, suggested_amounts_json
)
VALUES
  ('don_heritage_support', 'heritage-support', 'Heritage Support', 'Donation campaign setup for future approved fundraising. Public payment collection remains inactive.', 'draft', JSON_ARRAY(500000, 1000000, 2500000)),
  ('don_education_access', 'education-access', 'Education Access', 'Donation campaign setup for future approved education access support. Public payment collection remains inactive.', 'draft', JSON_ARRAY(250000, 500000, 1000000))
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  status = VALUES(status),
  suggested_amounts_json = VALUES(suggested_amounts_json);
