# Lovable Admin Interface Handoff

Status: **Phase 3 complete — commercial and specialist admin modules**.

## Implemented Admin Routes

Phase 1 and Phase 2 routes remain active:

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

Phase 3 routes now implemented:

| Route               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `/admin/payments`   | Payment review preview                  |
| `/admin/learning`   | Learning resource preview management    |
| `/admin/oriki`      | Oríkì and heritage consultation preview |
| `/admin/ceremonies` | Ceremony enquiry preview management     |
| `/admin/stay-own`   | Stay & Own enquiry preview management   |
| `/admin/media`      | Media metadata preview library          |

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
- `AdminFormSection`
- `AdminField`
- `AdminConfirmationDialog`
- `FeatureDisabledNotice`
- `AdminLoadingState`
- `AdminErrorState`

`AdminOperationPage` remains available for generic table/detail modules. Phase 3 specialist modules use direct compositions of the same primitives where extra filters, timelines, forms, confirmations or grid/list views are required.

## Components Extended Or Added

No new shared design system was introduced. Existing shared components were reused. Phase 3 route-level preview action buttons and notices are local to their route files.

## Types Added Or Extended

Added:

- `src/admin/types/learning.ts`
- `src/admin/types/oriki.ts`
- `src/admin/types/ceremonies.ts`
- `src/admin/types/stay-own.ts`
- `src/admin/types/media.ts`

Extended:

- `src/admin/types/payments.ts`
- `src/admin/types/index.ts`

Every operational record type continues to extend `DemoRecord`, enforcing `isDemo: true`.

## Services Added

`src/admin/services/admin-service.ts` now includes:

- `PaymentService.list(filters)` and `PaymentService.get(id)`
- `LearningService`
- `OrikiService`
- `CeremonyService`
- `StayOwnService`
- `MediaService`

`src/admin/services/mock-admin-service.ts` implements those methods with typed filters. Route files call `adminService`; raw mock arrays are imported only inside the mock service.

## Demonstration Records Added

Added mock records in:

- `src/admin/mock/learning.ts`
- `src/admin/mock/oriki.ts`
- `src/admin/mock/ceremonies.ts`
- `src/admin/mock/stay-own.ts`
- `src/admin/mock/media.ts`

Extended:

- `src/admin/mock/payments.ts`

All operational mock records carry `isDemo: true`. No `isDemo: false` records exist.

## Preview Actions Available

- Payments: mark for review locally, verification preview, refund-review preview.
- Learning: new-resource preview, edit preview, publish preview, archive confirmation, file-selection placeholder.
- Oríkì: assign for review locally, add internal note locally, propose consultation locally, close request locally.
- Ceremonies: proposal preview, date proposal preview, internal note preview, status update preview.
- Stay & Own: assign locally, propose inspection locally, add note locally, close enquiry locally.
- Media: select file locally, edit metadata locally, replace-file preview, delete confirmation preview, copy-reference preview, upload-interface preview.

Every preview write action reports: “Preview action completed locally. No production record was created.”

## Production Actions Deliberately Disabled

- Real payments and refunds.
- Payment-provider verification.
- Card storage.
- Real file upload, file deletion, download URLs or cloud media storage.
- Educational resource publishing.
- Oríkì generation, practitioner assignment or cultural approval.
- Ceremony packages, pricing, capacity, coordinator assignment or official confirmation.
- Property purchases, deposits, contracts, legal transfers, ownership records or property payments.
- Email, SMS and WhatsApp delivery.
- Authentication and authorisation enforcement.
- Live SOS dispatch.

## Responsive Behaviour

- Table-based modules use `AdminDataTable`, which becomes mobile cards below the medium breakpoint.
- Specialist modules keep detail panels below lists on narrow screens and side-by-side on wide screens.
- Media library supports grid and list views. The grid uses fixed preview tiles and the list uses the shared responsive table.

## Navigation

Activated:

- `/admin/payments`
- `/admin/learning`
- `/admin/oriki`
- `/admin/ceremonies`
- `/admin/stay-own`
- `/admin/media`

Remaining Phase 4 items stay disabled and non-clickable:

- `/admin/incidents`
- `/admin/users`
- `/admin/roles`
- `/admin/settings`
- `/admin/audit-logs`

## Feature Flags

`src/config/project-status.ts` remains the single status module. Relevant values remain false:

- `paymentEnabled`
- `mediaUploadEnabled`
- `bookingEnabled`
- `sosLiveEnabled`
- `authenticationEnabled`
- `emailEnabled`
- `smsEnabled`
- `whatsappEnabled`
- `ticketQrEnabled`
- `geolocationLiveEnabled`

## Deployment-Controlled Files

Not modified:

- `app.cjs`
- `vite.config.cpanel.ts`
- `.github/workflows/cpanel-preview.yml`
- `deploy/cpanel/yhp-preview.htaccess`

## Known Limitations

- Interface complete for Phase 3.
- Demonstration workflow complete for Phase 3.
- Backend pending.
- Production integration pending.
- All data remains in-memory demonstration data.
- Preview actions update local UI state only.
- No authentication, repository writes, payments, messaging, media storage or live SOS integrations exist.

## Backend Replacement Points

- Replace `src/admin/services/mock-admin-service.ts` with repository-backed implementations.
- Replace `src/admin/mock/*` once real repositories are available.
- Keep route components bound to `AdminService` interfaces.
- Keep feature activation centralised in `src/config/project-status.ts`.

## Recommended Next Backend Implementation Task

**Implement MySQL database foundations, environment validation, migrations and server-side repository interfaces without changing the approved admin interface.**
