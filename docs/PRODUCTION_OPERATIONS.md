# Production Operations

This note captures the minimum operational steps for the current cPanel deployment.

## Backup Procedure

1. Export the MySQL database from cPanel before any production change.
2. Keep a copy of the exported SQL dump outside the hosting account.
3. Record the deployed Git commit SHA alongside the backup.
4. Preserve the existing cPanel-managed `.env` file and application settings.

## Rollback Procedure

1. Identify the last known good commit from GitHub Actions or the release log.
2. Rebuild and redeploy that exact commit through the same production workflow.
3. Confirm the Passenger app restarts from `/repositories/yoruba-heritage-park-production`.
4. Recheck the homepage, `/about`, CSS, JavaScript and favicon after the redeploy.

## Observability

The app now supports optional, server-configured beacons for:

- `YHP_ANALYTICS_ENDPOINT`
- `YHP_MONITORING_ENDPOINT`
- `YHP_OBSERVABILITY_APP_NAME`

These are off by default. When configured, the app sends page-view and error/heartbeat
events to the endpoints without exposing secrets.

## Notes

- Do not overwrite the production `.env` during deploys.
- Keep preview and production deployments separate.
- Re-run the existing validation checks after any deploy-related change.
