# Database

This directory contains the plain SQL database foundation for Yoruba Heritage Park.

- `migrations/` contains ordered SQL files for the local migration runner.
- `seeds/` contains idempotent seed SQL for approved role and permission templates.
- `latest-schema.sql` is the current schema snapshot for manual phpMyAdmin import.

The application does not run migrations on Passenger startup. Use `bun run db:migrate`
only from a trusted local or shell environment with the database variables configured.
If cPanel shell access is unavailable, import `latest-schema.sql` through phpMyAdmin,
then import the seed SQL file separately if the phpMyAdmin client does not support
the `SOURCE` directive.
