import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { calculateChecksum } from "../src/server/db/migrations";
import { hashPassword } from "../src/server/auth/password";
import { normaliseEmail } from "../src/server/repositories/mysql/mysql-helpers";

const args = parseArgs(process.argv.slice(2));
if (!args.email || !args.displayName) {
  console.error(
    "Usage: bun run db:generate-cpanel-bootstrap --email EMAIL --display-name NAME [--force]",
  );
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), ".local");
const outPath = path.join(outDir, "cpanel-auth-bootstrap.sql");
if (existsSync(outPath) && !args.force) {
  console.error(
    "Refusing to overwrite .local/cpanel-auth-bootstrap.sql. Delete it securely or rerun with --force.",
  );
  process.exit(1);
}

const password = await promptPassword();
if (!password || Buffer.byteLength(password, "utf8") < 15) {
  console.error("Password must be at least 15 UTF-8 bytes.");
  process.exit(1);
}

const migrations = [
  migration("001_security_governance_schema.sql"),
  migration("002_authentication_sessions.sql"),
  migration("003_commercial_operations.sql"),
  migration("004_booking_profile_and_paypal.sql"),
];
const schema = read("database/latest-schema.sql");
const commercialOperationsSchema = read("database/migrations/003_commercial_operations.sql");
const bookingProfileAndPaypalSchema = read(
  "database/migrations/004_booking_profile_and_paypal.sql",
);
const seeds = [
  read("database/seeds/001_roles_permissions.sql"),
  read("database/seeds/002_auth_permissions.sql"),
];
const email = normaliseEmail(args.email);
const passwordHash = await hashPassword(password);
const userId = `user_${crypto.randomUUID()}`;
const auditId = `aud_${crypto.randomUUID()}`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, buildSql(), "utf8");
console.log(".local/cpanel-auth-bootstrap.sql generated.");
console.log("This file contains sensitive administrator provisioning material.");
console.log("Do not commit it. Delete it securely after successful phpMyAdmin import.");

function buildSql(): string {
  return `-- Yoruba Heritage Park cPanel preview authentication bootstrap.
-- SENSITIVE: contains a first-administrator password hash, never the plaintext password.
-- Import only into the dedicated empty preview database for yhp-preview.deedoc.org.
-- Do not commit this file. Delete it securely after successful import.
-- This bundle intentionally contains no database credentials and no USE statement.

START TRANSACTION;

-- Approved consolidated schema.
${schema}

-- Approved commercial operations schema.
${commercialOperationsSchema}

-- Approved booking profile and PayPal provider schema.
${bookingProfileAndPaypalSchema}

-- Approved role and permission seeds.
${seeds.join("\n\n")}

-- Migration tracking records for future db:migrate compatibility.
INSERT INTO schema_migrations (migration_name, checksum, execution_time_ms)
VALUES
${migrations.map((item) => `  (${q(item.name)}, ${q(item.checksum)}, 0)`).join(",\n")}
ON DUPLICATE KEY UPDATE
  checksum = VALUES(checksum),
  execution_time_ms = VALUES(execution_time_ms);

-- Deliberate first administrator provisioning.
INSERT INTO users (id, email, display_name, password_hash, account_status, email_verified_at)
VALUES (${q(userId)}, ${q(email)}, ${q(args.displayName)}, ${q(passwordHash)}, 'active', CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role_id)
SELECT ${q(userId)}, id FROM roles WHERE role_code = 'super_administrator';

INSERT INTO audit_logs (id, actor_user_id, action_code, module_code, record_type, record_id, outcome, metadata_json)
VALUES (${q(auditId)}, ${q(userId)}, 'auth.admin.bootstrap_sql_generated', 'auth', 'user', ${q(userId)}, 'success', JSON_OBJECT('source', 'db:generate-cpanel-bootstrap'));

COMMIT;
`;
}

function migration(name: string) {
  const sql = read(`database/migrations/${name}`);
  return { name, checksum: calculateChecksum(sql) };
}

function read(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!existsSync(fullPath)) throw new Error(`Required file missing: ${relativePath}`);
  return readFileSync(fullPath, "utf8").trim();
}

function q(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

async function promptPassword(): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    console.error("Enter the first administrator password. Input may echo in this terminal.");
    return await rl.question("Administrator password: ");
  } finally {
    rl.close();
  }
}

function parseArgs(values: string[]) {
  const result: { email?: string; displayName?: string; force?: boolean } = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--email") result.email = values[++index];
    else if (value === "--display-name") result.displayName = values[++index];
    else if (value === "--force") result.force = true;
  }
  return result;
}
