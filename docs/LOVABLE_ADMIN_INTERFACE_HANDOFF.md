# Lovable Admin Interface Handoff

Status: **Phase 2 complete — core admin operations baseline**.

## Phase 2 Scope

- Core admin operation routes were added for content, experiences, events, calendar, bookings, tickets, enquiries and appointments.
- All Phase 2 routes read through `adminService`; route components do not import raw mock arrays.
- The mock service remains the only source module that imports `src/admin/mock/*`.
- Demonstration records remain explicitly marked with `isDemo: true`.
- Local preview actions show: “Preview action completed locally. No production record was created.”
- Payment activation, booking writes, outbound communications, QR validation and live SOS remain disabled.

## Active Admin Routes

| Route                 | Purpose                         |
| --------------------- | ------------------------------- |
| `/admin`              | Admin layout shell              |
| `/admin/`             | Dashboard overview              |
| `/admin/content`      | Pages and content review        |
| `/admin/experiences`  | Experience record preview       |
| `/admin/events`       | Event record preview            |
| `/admin/calendar`     | Calendar-oriented event preview |
| `/admin/bookings`     | Booking record preview          |
| `/admin/tickets`      | Ticket and check-in preview     |
| `/admin/enquiries`    | Enquiry management preview      |
| `/admin/appointments` | Appointment request preview     |
| `/admin/sos`          | SOS console test-record mode    |

## Disabled Navigation Entries

The sidebar keeps later-phase modules visible but non-clickable:

- `/admin/payments`
- `/admin/learning`
- `/admin/oriki`
- `/admin/ceremonies`
- `/admin/stay-own`
- `/admin/media`
- `/admin/incidents`
- `/admin/users`
- `/admin/roles`
- `/admin/settings`
- `/admin/audit-logs`

These entries are labelled by phase and do not route to not-found pages.

## Reusable Components

Location: `src/admin/components/`

- Existing Phase 1 components remain in use.
- `AdminOperationPage` was added as the shared Phase 2 route surface for search, status filtering, preview banners, tables, detail panels and local-only preview actions.
- `AdminSidebar` now supports disabled future navigation entries.

## Services

Location: `src/admin/services/`

- `admin-service.ts` now exposes detail lookups and typed filters for Phase 2 modules.
- `mock-admin-service.ts` implements those methods against in-memory demonstration data.
- Future MySQL work should replace the mock implementation without changing route components.

## Demonstration Data

Location: `src/admin/mock/`

- `appointments.ts` was added.
- Content, event, booking and enquiry fixture wording was cleaned for UTF-8 integrity and professional pending-state language.
- Every operational record is still `isDemo: true`.

## Feature Flags

`src/config/project-status.ts` remains the central status module. The relevant defaults remain:

- `contentMode: "preview"`
- `bookingEnabled: false`
- `paymentEnabled: false`
- `sosLiveEnabled: false`
- `showPendingInformation: true`
- communication, QR, geolocation and media upload integrations disabled

## Production Functions Deliberately Disabled

- Real authentication and admin login.
- Real booking creation, confirmation, cancellation and check-in writes.
- Real payments or refunds.
- Real email, SMS or WhatsApp delivery.
- Real ticket QR issuance and validation.
- Live geolocation transmission and live SOS dispatch.
- Real property transactions.
- Cloud media uploads.

## Source Integrity

- The automated text integrity check remains available through `bun run check:text-integrity`.
- The check blocks common UTF-8 mojibake sequences, replacement-marker strings and byte-order marks in source-controlled text files.

## Deployment-Controlled Files

Not modified during Phase 2:

- `app.cjs`
- `vite.config.cpanel.ts`
- `.github/workflows/cpanel-preview.yml`
- `deploy/cpanel/yhp-preview.htaccess`

## Known Limitations

- All admin data is still demonstration data.
- Route actions update local React state only.
- Forms are not connected to repositories.
- Payment, QR and communication modules are intentionally unavailable.
- Authorisation remains a UI-level placeholder until server-side authentication and roles are implemented.

## Recommended Next Backend Implementation Task

**MySQL database foundation, environment validation and server-side repository layer**
