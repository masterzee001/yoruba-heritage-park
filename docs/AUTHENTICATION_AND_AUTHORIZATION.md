# Authentication and Authorization

Authentication implementation is complete, secure-session implementation is complete, and server authorization implementation is complete. cPanel preview authentication is prepared but not activated. First administrator provisioning is pending. Operational database integration is pending.

## Architecture

The administrator authentication layer lives under `src/server/auth` and is server-only. It uses repository contracts for users, roles, permissions, sessions, login attempts and audit logs. Public pages and operational administrator modules are not connected to production data in this phase.

## Modes

`AUTH_MODE=disabled` is the default. The existing preview administrator portal remains accessible, no database credentials are required, and mock operational data remains in use.

`AUTH_MODE=database` requires valid MySQL/MariaDB variables. Administrator access is expected to use database-backed users, sessions, permissions and audit events.

## Password Hashing

Passwords use Node `crypto.scrypt` with a versioned self-describing format:

```text
$scrypt$v=1$N=32768$r=8$p=3$<salt>$<derived-key>
```

The selected OWASP-listed profile is `N=32768`, `r=8`, `p=3`, and 64-byte derived keys. Password input is capped to reduce resource-exhaustion risk. Passwords are never logged or returned to browser-facing data.

## Sessions

Session tokens are opaque random values generated from 32 random bytes. The cookie stores only the raw opaque token. The database stores only a SHA-256 hash of that token. Sessions enforce idle expiry, absolute expiry and explicit revocation server-side.

Defaults:

```text
Idle timeout: 30 minutes
Absolute timeout: 8 hours
```

## Cookies

The administrator cookie defaults to `yhp_admin` and is scoped to `/admin` with `HttpOnly`, `SameSite=Lax`, no `Domain` attribute and `Secure` in production or when HTTPS is detected through the trusted cPanel/Passenger proxy path.

## CSRF

Authenticated state-changing requests use synchronizer CSRF tokens. The raw token is generated per session; only its hash is stored. POST, PUT, PATCH and DELETE requests must provide a valid token. CSRF tokens are not accepted through URLs.

## Login Throttling and Lockout

Login attempts are tracked by hashed normalized email identity and hashed source IP. Failures return a generic message. Account lockout uses `failed_login_count` and `locked_until` and is temporary by default.

## Account States

Only active, non-archived users can authenticate. Invited, suspended, disabled and archived accounts cannot log in.

## Server Permissions

Permissions are read from database roles and role permissions in database mode. Client-side navigation, hidden controls and browser-provided claims are not authorization.

Route map:

```text
/admin -> admin.access
/admin/content -> content.view
/admin/experiences -> content.view
/admin/events -> events.view
/admin/calendar -> events.view
/admin/bookings -> bookings.view
/admin/tickets -> bookings.view
/admin/enquiries -> enquiries.view
/admin/appointments -> appointments.view
/admin/payments -> payments.view
/admin/learning -> content.view
/admin/oriki -> enquiries.view
/admin/ceremonies -> enquiries.view
/admin/stay-own -> enquiries.view
/admin/media -> content.view
/admin/sos -> safety.view
/admin/incidents -> safety.view
/admin/users -> users.manage
/admin/roles -> roles.manage
/admin/settings -> settings.manage
/admin/audit-logs -> audit.view
```

## Audit Events

Implemented event codes include `auth.login.success`, `auth.login.failure`, `auth.login.rate_limited`, `auth.account.locked`, `auth.logout`, `auth.session.revoked` and `auth.access.denied`. Audit metadata is sanitized and does not contain passwords, raw session tokens, raw CSRF tokens or complete cookies. The preview audit interface remains mock data.

## Administrator Provisioning

No administrator is seeded. Provisioning is deliberate:

```bash
bun run auth:hash-password
bun run auth:create-admin --email admin@example.com --display-name "Admin Name" --password "..." --super-admin
bun run auth:generate-bootstrap-sql --email admin@example.com --display-name "Admin Name" --password "..."
```

The bootstrap SQL workflow supports phpMyAdmin. Generated `auth-bootstrap-*.sql` files are ignored by Git and must be deleted securely after use.

For a full cPanel preview import, prefer:

```bash
bun run db:generate-cpanel-bootstrap --email admin@example.com --display-name "Admin Name"
```

That bundle includes schema, seeds, migration tracking records and one deliberate administrator insert in `.local/cpanel-auth-bootstrap.sql`.

## cPanel and HTTPS

Production authentication must run behind HTTPS. `AUTH_TRUST_PROXY=true` allows the application to recognize HTTPS forwarded by the trusted cPanel/Passenger proxy path. Do not trust arbitrary proxy headers outside the controlled hosting path.

## Environment Variables

```text
AUTH_MODE=disabled
AUTH_SESSION_COOKIE_NAME=yhp_admin
AUTH_SESSION_IDLE_MINUTES=30
AUTH_SESSION_ABSOLUTE_HOURS=8
AUTH_LOGIN_WINDOW_MINUTES=15
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_ACCOUNT_LOCK_MINUTES=15
AUTH_PASSWORD_MIN_LENGTH=15
AUTH_TRUST_PROXY=true
```

## Security Limitations

Authentication is implemented but remains disabled by default. The administrator portal still uses mock operational data. Password reset, invitations, MFA, email verification delivery and operational module database integration are intentionally out of scope.

## Activation Checklist

1. Create the cPanel MySQL database.
2. Apply approved migrations and seeds.
3. Provision the first administrator securely.
4. Set `AUTH_MODE=database`.
5. Validate HTTPS proxy behavior and secure cookies.
6. Confirm login, logout, session revocation and permission enforcement.

## Emergency Deactivation

Set `AUTH_MODE=disabled` and redeploy the environment configuration. This returns the administrator portal to preview access and mock operational data.

## Session Revocation

Use repository-level session revocation for one session or all sessions belonging to a user. Privilege changes should revoke existing sessions.

## Next Backend Task

Create and validate the cPanel MySQL database, apply approved migrations, provision the first administrator securely and activate database authentication in the preview environment.
