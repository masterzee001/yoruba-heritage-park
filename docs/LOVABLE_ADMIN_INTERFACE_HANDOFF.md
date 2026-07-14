# Lovable Admin Interface Handoff

Status: **Phase 4 complete — safety, users and governance preview interface**.

## Complete Admin Route Inventory

| Route                 | Purpose                                 |
| --------------------- | --------------------------------------- |
| `/admin`              | Admin layout shell                      |
| `/admin/`             | Dashboard overview                      |
| `/admin/content`      | Pages and content review                |
| `/admin/experiences`  | Experience record preview               |
| `/admin/events`       | Event record preview                    |
| `/admin/calendar`     | Calendar-oriented event preview         |
| `/admin/bookings`     | Booking record preview                  |
| `/admin/tickets`      | Ticket and check-in preview             |
| `/admin/enquiries`    | Enquiry management preview              |
| `/admin/appointments` | Appointment request preview             |
| `/admin/payments`     | Payment review preview                  |
| `/admin/learning`     | Learning resource preview management    |
| `/admin/oriki`        | Oríkì and heritage consultation preview |
| `/admin/ceremonies`   | Ceremony enquiry preview management     |
| `/admin/stay-own`     | Stay & Own enquiry preview management   |
| `/admin/media`        | Media metadata preview library          |
| `/admin/sos`          | SOS console test-alert mode             |
| `/admin/incidents`    | Incident management preview             |
| `/admin/users`        | User management preview                 |
| `/admin/roles`        | Role and permission matrix preview      |
| `/admin/settings`     | Settings and feature-control preview    |
| `/admin/audit-logs`   | Audit-log preview                       |

No active administrator navigation item points to a missing route.

## Phase 4 Routes Created

- `/admin/incidents`
- `/admin/users`
- `/admin/roles`
- `/admin/settings`
- `/admin/audit-logs`

## SOS Console Improvements

`/admin/sos` remains the existing preview-only SOS console, now with:

- Strong SOS preview banner.
- Breadcrumbs.
- Test-alert queue labels.
- GPS latitude, longitude and accuracy placeholders.
- Acknowledgement, response, resolution and related-incident placeholders.
- Timeline display.
- Map placeholder.
- Local-only preview actions for acknowledgement, responder assignment, response notes, responding state, resolution and related-incident creation.

No live SOS dispatch, geolocation, mapping, messaging or emergency API is connected.

## Incident Management

Incidents are separate from SOS alerts. They may reference a test SOS alert but do not dispatch responders or persist incident records. Incident records include source, category, severity, status, visitor/ticket placeholder, location/GPS placeholders, timeline, notes and closure state.

## Users

The user-management interface supports search, role/status filters, detail view and preview actions for invitation, edit, suspension, restore, role assignment and password reset notice. It does not create users, sessions, invitations or password resets.

## Roles And Permissions

The roles interface includes the approved future roles:

- Super Administrator
- Content Manager
- Booking Officer
- Safety Officer
- Viewer / Auditor

`AdminPermissionMatrix` displays a read-only module/action permission matrix. `PermissionNotice` states that real authorisation must be enforced by the production server.

## Settings

The settings interface groups safe preview settings for general, visitor information, booking, payments, notifications, safety, media, SEO, legal/privacy and feature controls. It does not expose secrets or environment values.

Feature controls reflect `src/config/project-status.ts`; critical flags remain disabled and locked.

## Audit Logs

Audit logs are demonstration records only. They use masked placeholders such as `192.0.2.xxx` and `Preview browser`. Export and copy-reference actions are local preview actions only.

## Shared Components Reused

- `AdminBreadcrumbs`
- `AdminPageHeader`
- `PreviewModeBanner`
- `AdminFilterBar`
- `FilterChip`
- `AdminSearchInput`
- `AdminDataTable`
- `AdminDetailPanel`
- `DetailRow`
- `AdminStatusBadge`
- `DemoBadge`
- `AdminTimeline`
- `AdminModal`
- `AdminConfirmationDialog`
- `FeatureDisabledNotice`
- `PermissionNotice`
- `AdminLoadingState`
- `AdminErrorState`
- `AdminEmptyState`

## Components Created Or Extended

Created:

- `AdminPermissionMatrix`
- `AdminSettingsSection`

Updated:

- `PermissionNotice` wording now clearly describes preview-only permission UI.

## Types Created Or Extended

Created:

- `src/admin/types/incidents.ts`
- `src/admin/types/governance.ts`

Extended:

- `src/admin/types/sos.ts`
- `src/admin/types/users.ts`
- `src/admin/types/index.ts`

All operational record types continue to extend `DemoRecord`.

## Service Methods Added

`AdminService` now includes:

- `incidents.list/get`
- `users.list/get`
- `roles.list/get`
- `settings.get`
- `auditLogs.list/get`

Routes call `adminService`; raw mock arrays are imported only by `mock-admin-service.ts`.

## Demonstration Records Added

Added:

- `src/admin/mock/incidents.ts`
- `src/admin/mock/governance.ts`

Extended:

- `src/admin/mock/sos.ts`
- `src/admin/mock/users.ts`

Every operational mock record contains `isDemo: true`.

## Preview Actions Available

- Incidents: local assignment, acknowledgement, note, resolution and closure confirmation.
- SOS: local acknowledgement, responder placeholder assignment, response note, responding state, resolution and related incident preview.
- Users: new-user invitation preview, edit preview, suspension confirmation, restore, role assignment and password-reset notice.
- Roles: duplicate role, edit role, permission change and restore default previews.
- Settings: local presentation-settings save preview.
- Audit logs: export preview and copy-reference preview.

Every local write action reports: “Preview action completed locally. No production record was created.”

## Production Actions Deliberately Disabled

- Real authentication, sessions, invitations, password resets or permission enforcement.
- Live SOS dispatch, geolocation transmission, emergency notifications or emergency APIs.
- Real email, SMS or WhatsApp.
- Real audit capture, device fingerprinting, IP capture or export files.
- Database writes.
- Payment, media upload and ticket QR integrations remain disabled.

## Security Limitations

The portal is an interface preview. Navigation visibility and permission matrix displays are not security boundaries. Production authorisation, audit logging and operational controls must be enforced by server-side code.

## Responsive Behaviour

All table modules use responsive tables that become mobile cards. Specialist detail panels stack below records on smaller screens and sit side-by-side on wide screens. Settings sections are full-width stacked panels.

## Feature Flags

Critical values remain:

- `contentMode: "preview"`
- `bookingEnabled: false`
- `paymentEnabled: false`
- `sosLiveEnabled: false`
- `authenticationEnabled: false`
- `emailEnabled: false`
- `smsEnabled: false`
- `whatsappEnabled: false`
- `geolocationLiveEnabled: false`
- `ticketQrEnabled: false`
- `mediaUploadEnabled: false`

## Deployment-Controlled Files

Not modified:

- `app.cjs`
- `vite.config.cpanel.ts`
- `.github/workflows/cpanel-preview.yml`
- `deploy/cpanel/yhp-preview.htaccess`

## Backend Replacement Points

- Replace `src/admin/services/mock-admin-service.ts` with repository-backed implementations.
- Replace `src/admin/mock/*` once real repositories are available.
- Keep route components bound to `AdminService` interfaces.
- Keep feature activation centralised in `src/config/project-status.ts`.
- Implement production authentication, authorisation, audit capture, SOS integrations and messaging only on the backend.

## Remaining Production Work

- MySQL schema, migrations and repositories.
- Environment validation.
- Server-side authentication and roles.
- Server-side audit logging.
- Production SOS, geolocation and notification integrations.
- Production payment, media, booking and messaging integrations.

## Next Task

**Implement the MySQL database foundation, environment validation, migrations and server-side repository layer while preserving the approved admin interface.**
