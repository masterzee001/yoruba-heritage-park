import { closeDatabasePool } from "../src/server/db";
import { withTransaction } from "../src/server/db/transaction";
import { getServerEnv } from "../src/server/env/server-env";
import { hashPassword } from "../src/server/auth/password";
import { normaliseEmail } from "../src/server/repositories/mysql/mysql-helpers";

const args = parseArgs(process.argv.slice(2));
if (!args.email || !args.displayName || !args.password) {
  console.error(
    "Usage: bun run auth:create-admin --email EMAIL --display-name NAME --password PASSWORD --super-admin",
  );
  process.exit(1);
}
if (!args.superAdmin) {
  console.error("Refusing to assign Super Administrator unless --super-admin is provided.");
  process.exit(1);
}

try {
  const env = getServerEnv({ requireDatabase: true });
  if (env.auth.mode !== "database") {
    throw new Error("AUTH_MODE=database is required for administrator creation.");
  }
  const email = normaliseEmail(args.email);
  const passwordHash = await hashPassword(args.password);
  await withTransaction(async (connection) => {
    const [existing] = await connection.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
      email,
    ]);
    if (Array.isArray(existing) && existing.length > 0) {
      throw new Error("A user with that email already exists.");
    }
    const userId = `user_${crypto.randomUUID()}`;
    await connection.query(
      `INSERT INTO users (id, email, display_name, password_hash, account_status, email_verified_at)
       VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
      [userId, email, args.displayName, passwordHash],
    );
    await connection.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT ?, id FROM roles WHERE role_code = 'super_administrator'`,
      [userId],
    );
    await connection.query(
      `INSERT INTO audit_logs (id, actor_user_id, action_code, module_code, record_type, record_id, outcome, metadata_json)
       VALUES (?, ?, 'auth.admin.created', 'auth', 'user', ?, 'success', ?)`,
      [
        `aud_${crypto.randomUUID()}`,
        userId,
        userId,
        JSON.stringify({ source: "auth:create-admin" }),
      ],
    );
  });
  console.log("Administrator created. Password and hash were not printed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Administrator creation failed.");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}

function parseArgs(values: string[]) {
  const result: { email?: string; displayName?: string; password?: string; superAdmin?: boolean } =
    {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--email") result.email = values[++index];
    else if (value === "--display-name") result.displayName = values[++index];
    else if (value === "--password") result.password = values[++index];
    else if (value === "--super-admin") result.superAdmin = true;
  }
  return result;
}
