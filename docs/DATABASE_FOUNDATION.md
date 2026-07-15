# Database Foundation

## Architecture

Backend Phase 1 adds a server-only MySQL/MariaDB foundation for the existing TanStack Start, Nitro and cPanel application. The approved public site and preview administrator portal are unchanged. Administrator routes continue to use the mock `AdminService`; MySQL repositories exist only behind server-side contracts for future integration.

## Environment Variables

Server database variables must never use a `VITE_` prefix.

Required only for database commands or `ADMIN_DATA_SOURCE=mysql`:

- `DATABASE_HOST`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`

Safe defaults:

- `DATABASE_PORT=3306`
- `DATABASE_CONNECTION_LIMIT=5`
- `DATABASE_SSL_MODE=disabled`
- `ADMIN_DATA_SOURCE=mock`

Allowed values:

- `ADMIN_DATA_SOURCE=mock | mysql`
- `DATABASE_SSL_MODE=disabled | preferred | required`

`.env.example` documents placeholders only. Real `.env` files are ignored by Git.

## Local MySQL Setup

Create a local MySQL or MariaDB database with `utf8mb4` character support. Configure `.env` with the database variables above, then run:

```text
bun run db:validate
bun run db:check
bun run db:status
bun run db:migrate
```

`db:validate` checks configuration without opening a connection. `db:check`, `db:status` and `db:migrate` require live database credentials.

## cPanel MySQL Setup

Create the database and database user through cPanel. Grant the application user only the permissions needed for the approved schema and future application operations. Do not place credentials in source control or browser-exposed variables.

The application does not run migrations during Passenger startup. Builds also do not require database variables.

## Database User Permissions

For migration execution, the database user needs table creation and alteration permissions for the target database. For runtime repository access later, use a narrower user where possible with read/write access only to approved application tables.

## Connection Pool

The pool uses `mysql2/promise`, is created lazily, and is reused per Node process. No connection is opened during module import, Vite build, cPanel build, or Passenger startup unless a database function is explicitly called.

Default connection limit is `5`, capped conservatively for shared cPanel hosting.

## Migration Workflow

Migration files live in `database/migrations` and use ordered names such as `001_security_governance_schema.sql`. The runner records successful migrations in `schema_migrations`, stores checksums, detects changed applied migrations and stops on failure.

Migrations are plain UTF-8 SQL and can be reviewed or imported manually.

## phpMyAdmin Manual Import

If cPanel shell access is unavailable, import `database/latest-schema.sql` through phpMyAdmin. This snapshot includes the current schema and provisional role/permission seed data. If importing seed files separately, use `database/seeds/001_roles_permissions.sql`.

Manual imports do not provide the same checksum tracking as the migration runner.

## Schema Tables

Created foundation tables:

- `schema_migrations`
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `app_settings`
- `audit_logs`

Tourism, ticketing, booking, payment, media, SOS and content persistence tables are intentionally not included in this phase.

## Identifier Strategy

Application records use stable string IDs stored in `VARCHAR(64)`. Seeded roles and permissions use deterministic IDs. Future application-created rows should use application-generated UUID-compatible prefixed IDs.

## Character Encoding

Tables use `utf8mb4` with `utf8mb4_unicode_ci` collation and InnoDB. The MySQL pool requests `utf8mb4`.

## Repository Contracts

Server-side contracts exist for:

- `UsersRepository`
- `RolesRepository`
- `SettingsRepository`
- `AuditLogRepository`

MySQL implementations provide foundational read methods and an audit-log write method for future backend use. User repository results do not expose `password_hash`.

## Data Source Boundary

`ADMIN_DATA_SOURCE=mock` remains the default. The preview administrator interface remains on the mock service. The MySQL foundation exists server-side but is not yet connected to administrator routes.

Future integration should select `mock` or `mysql` behind an application-facing service boundary without importing MySQL modules into browser components.

## Security Restrictions

- No credentials are committed.
- No database variables use `VITE_`.
- SQL inputs are parameterised.
- Sanitised errors do not expose hostnames, usernames, database names, SQL text or secrets.
- No public database health endpoint exists.
- Migrations are not automatic on startup.
- `app_settings` must not store API keys, payment secrets or database credentials.
- Authentication, sessions and role enforcement are not implemented in this phase.

## Backup Expectations

Take a cPanel database backup before running migrations or manual imports in any production-like environment. The migration runner does not implement backup creation.

## Rollback Limitations

This phase does not include down migrations. Rollback is by restoring a verified database backup or applying an approved forward migration.

## Known Risks

- Shared cPanel environments may enforce lower connection limits than local development.
- phpMyAdmin manual imports bypass migration checksum tracking.
- MariaDB and MySQL JSON behavior can differ; JSON values should be validated at the application layer.
- Repository code is not yet connected to administrator routes.

## Next Backend Task

**Implement administrator authentication, secure sessions and server-enforced role-based authorisation using the approved MySQL repository foundation.**

# Authentication Status

Authentication code is implemented and cPanel preview activation is prepared but not activated. The administrator portal still uses mock operational data. The authentication tables are present in migration `002_authentication_sessions.sql`; activation requires cPanel database creation, phpMyAdmin bootstrap import, environment configuration, Passenger restart and smoke testing.
