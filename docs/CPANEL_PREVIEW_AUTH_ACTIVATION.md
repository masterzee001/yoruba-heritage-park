# cPanel Preview Authentication Activation

Status: prepared but not activated.

This procedure applies only to `https://yhp-preview.deedoc.org`. It must not be used for the official production domain.

## Scope

Authentication can be activated for the cPanel preview administrator portal while `ADMIN_DATA_SOURCE` remains `mock`. Operational modules continue to display demonstration data.

## Database Creation

In cPanel MySQL Databases:

1. Create a new database dedicated to the preview environment.
2. Create a dedicated database user with a strong unique password.
3. Assign the user only to the preview database.
4. Temporarily grant schema/import privileges for bootstrap import.
5. Record the cPanel-prefixed database name, username and host privately.

Do not use a WordPress database, another project database, root account, production database or cPanel account password.

## Bootstrap Bundle

Generate the phpMyAdmin import bundle locally:

```bash
bun run db:generate-cpanel-bootstrap --email <authorised-admin-email> --display-name "<authorised display name>"
```

The script writes:

```text
.local/cpanel-auth-bootstrap.sql
```

The file is ignored by Git. It contains a password hash for the first administrator and must be deleted securely after import. It does not contain plaintext passwords, database credentials, `USE` statements, `DROP DATABASE` or `DROP TABLE`.

The bundle includes:

1. `database/latest-schema.sql`
2. `database/seeds/001_roles_permissions.sql`
3. `database/seeds/002_auth_permissions.sql`
4. `schema_migrations` records for migrations `001` and `002` using checksums from the migration runner
5. One deliberate administrator insert
6. Super Administrator role assignment
7. A sanitized audit event

## phpMyAdmin Import

Before importing:

1. Select only the dedicated preview database.
2. Confirm the database is empty.
3. Confirm the SQL file has no database-selection command for another database.
4. Confirm no destructive database operation is present.

After import, verify these tables exist:

```text
schema_migrations
users
roles
permissions
user_roles
role_permissions
app_settings
audit_logs
auth_sessions
auth_login_attempts
```

Confirm migrations `001` and `002` are recorded, approved seeds exist, exactly one authorised administrator exists, no plaintext password appears, no demonstration users were inserted, and no sessions or login attempts exist before testing.

## Environment Variables

Configure these names only through cPanel’s secure Node.js application environment mechanism:

```text
NODE_ENV
ADMIN_DATA_SOURCE
AUTH_MODE
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
DATABASE_CONNECTION_LIMIT
DATABASE_SSL_MODE
AUTH_SESSION_COOKIE_NAME
AUTH_SESSION_IDLE_MINUTES
AUTH_SESSION_ABSOLUTE_HOURS
AUTH_LOGIN_WINDOW_MINUTES
AUTH_MAX_LOGIN_ATTEMPTS
AUTH_ACCOUNT_LOCK_MINUTES
AUTH_PASSWORD_MIN_LENGTH
AUTH_TRUST_PROXY
```

Required preview values:

```text
NODE_ENV=production
ADMIN_DATA_SOURCE=mock
AUTH_MODE=database
AUTH_SESSION_COOKIE_NAME=yhp_admin
AUTH_SESSION_IDLE_MINUTES=30
AUTH_SESSION_ABSOLUTE_HOURS=8
AUTH_LOGIN_WINDOW_MINUTES=15
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_ACCOUNT_LOCK_MINUTES=15
AUTH_PASSWORD_MIN_LENGTH=15
AUTH_TRUST_PROXY=true
```

Do not commit or document actual database credentials.

## Passenger Restart

After environment variables are configured:

1. Restart the Node.js application in cPanel.
2. Confirm the app starts.
3. Confirm logs do not show database credentials.
4. Confirm migrations do not run automatically.
5. Confirm no public stack trace exposes secrets.

If startup fails, set `AUTH_MODE=disabled`, restart, preserve the database for investigation and report only sanitized errors.

## Smoke Test

Public website:

- Homepage loads.
- Public navigation works.
- Discover page loads.
- Public pages do not require administrator authentication.
- Public navigation has no administrator login link.

Administrator authentication:

- `/admin/login` loads without public header/footer.
- `/admin` redirects to `/admin/login`.
- Protected child routes redirect to login.
- Invalid return URLs cannot redirect outside `/admin`.
- Unknown email and wrong password show the same generic failure.
- Valid administrator login succeeds.
- Authenticated identity is displayed.
- Operational data remains demonstration data.

Cookie verification:

- Cookie is `HttpOnly`.
- Cookie is `Secure` over HTTPS.
- Cookie uses `SameSite=Lax`.
- Cookie path is `/admin`.
- No unnecessary `Domain` attribute is present.

Session and logout:

- Reload preserves a valid session.
- Logout uses POST.
- Logout revokes the database session.
- Logout expires the browser cookie.
- Revoked session cannot reopen `/admin`.
- No session token appears in URLs.

Permission verification:

- Super Administrator can access `/admin/users`, `/admin/roles`, `/admin/settings` and `/admin/audit-logs`.
- If a restricted test user is deliberately provisioned later, missing permissions must produce forbidden access server-side.

CSRF verification:

- Authenticated state-changing actions use server-mediated POST.
- GET requests do not perform logout.
- CSRF/session values do not appear in URLs or logs.

Audit verification:

- Successful login is recorded.
- Failed login is recorded.
- Logout is recorded.
- Access denial is recorded if tested.

The preview audit UI remains mock data.

## Rollback

Emergency rollback:

1. Set `AUTH_MODE=disabled`.
2. Restart the cPanel Node.js application.
3. Confirm the public website remains available.
4. Confirm the preview admin portal returns to disabled-auth preview behavior.
5. Confirm database tables are not deleted.

To restore activation, set `AUTH_MODE=database`, restart, and repeat smoke tests.

## Runtime Privileges

After schema import succeeds, reduce the runtime database user where cPanel permits. Runtime should ordinarily need `SELECT`, `INSERT`, `UPDATE` and `DELETE`. Future migrations may require temporary privilege elevation or a separate migration user.

## Secret Handling

Do not commit or share:

- Database credentials
- Administrator passwords
- Real password hashes
- Generated bootstrap SQL
- Session tokens
- CSRF tokens
- Full table exports containing real admin data

## Known Limitations

Preview activation cannot be considered complete until the cPanel database is created, the bootstrap bundle is imported, environment variables are configured, Passenger is restarted, rollback is tested and the preview smoke-test checklist passes.

## Remaining Production Work

Official production activation is pending and must be handled separately after preview authentication is proven stable.

