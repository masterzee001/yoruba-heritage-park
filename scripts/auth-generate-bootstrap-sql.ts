import { writeFileSync } from "node:fs";

import { hashPassword } from "../src/server/auth/password";
import { normaliseEmail } from "../src/server/repositories/mysql/mysql-helpers";

const args = parseArgs(process.argv.slice(2));
if (!args.email || !args.displayName || !args.password) {
  console.error(
    "Usage: bun run auth:generate-bootstrap-sql --email EMAIL --display-name NAME --password PASSWORD",
  );
  process.exit(1);
}

const email = normaliseEmail(args.email);
const passwordHash = await hashPassword(args.password);
const userId = `user_${crypto.randomUUID()}`;
const auditId = `aud_${crypto.randomUUID()}`;
const fileName = `auth-bootstrap-${Date.now()}.sql`;

const sql = `-- Yoruba Heritage Park administrator bootstrap SQL.
-- Import only into the intended cPanel MySQL database after migrations and seeds have been applied.
-- Delete this file securely after use. It contains a password hash, never the plaintext password.

START TRANSACTION;

INSERT INTO users (id, email, display_name, password_hash, account_status, email_verified_at)
VALUES (${q(userId)}, ${q(email)}, ${q(args.displayName)}, ${q(passwordHash)}, 'active', CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role_id)
SELECT ${q(userId)}, id FROM roles WHERE role_code = 'super_administrator';

INSERT INTO audit_logs (id, actor_user_id, action_code, module_code, record_type, record_id, outcome, metadata_json)
VALUES (${q(auditId)}, ${q(userId)}, 'auth.admin.bootstrap_sql_generated', 'auth', 'user', ${q(userId)}, 'success', JSON_OBJECT('source', 'auth:generate-bootstrap-sql'));

COMMIT;
`;

writeFileSync(fileName, sql, "utf8");
console.log(`Bootstrap SQL written to ${fileName}. Delete it securely after import.`);

function q(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function parseArgs(values: string[]) {
  const result: { email?: string; displayName?: string; password?: string } = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--email") result.email = values[++index];
    else if (value === "--display-name") result.displayName = values[++index];
    else if (value === "--password") result.password = values[++index];
  }
  return result;
}
