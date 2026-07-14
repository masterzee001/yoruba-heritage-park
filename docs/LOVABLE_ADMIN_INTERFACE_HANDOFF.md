# Lovable Admin Interface Handoff

Status: **Phase 1 complete — foundation only**. Phases 2–4 (operational
modules) are not yet built.

## Scope of Phase 1

- Admin folder architecture (`src/admin/`).
- Central feature-flag module (`src/config/project-status.ts`).
- Typed admin data models.
- Typed service interfaces (`AdminService`) and mock implementation.
- Centralised demonstration data — every operational record carries
  `isDemo: true`.
- Reusable admin components (shell, sidebar, mobile drawer, header, page
  header, breadcrumbs, tables, filters, forms, status badges, empty /
  loading / error states, timeline, drawer, modal, confirmation dialog,
  preview / feature-disabled / permission notices).
- Refactor of `/admin` (layout), `/admin/` (dashboard) and `/admin/sos`
  onto the new shell + typed services.

## Admin routes

Only three admin routes are wired in Phase 1:

| Route        | Purpose                             |
| ------------ | ----------------------------------- |
| `/admin`     | Admin layout (renders `<Outlet />`) |
| `/admin/`    | Dashboard overview                  |
| `/admin/sos` | SOS console (test records only)     |

The sidebar already lists every planned Phase 2–4 route (`/admin/bookings`,
`/admin/tickets`, `/admin/enquiries`, `/admin/appointments`,
`/admin/payments`, `/admin/experiences`, `/admin/events`, `/admin/calendar`,
`/admin/learning`, `/admin/oriki`, `/admin/ceremonies`, `/admin/stay-own`,
`/admin/content`, `/admin/media`, `/admin/incidents`, `/admin/users`,
`/admin/roles`, `/admin/settings`, `/admin/audit-logs`). These links will
resolve as "not found" until their route files are added in the next
phases — this is expected.

## Reusable components

Location: `src/admin/components/`

- Shell / navigation: `AdminShell`, `AdminSidebar`, `AdminMobileNavigation`,
  `AdminHeader`.
- Layout primitives: `AdminPageHeader`, `AdminBreadcrumbs`,
  `AdminDetailPanel` (`DetailRow`), `AdminFormSection` (`AdminField`).
- Data display: `AdminStatCard`, `AdminDataTable`, `AdminFilterBar`
  (`FilterChip`), `AdminSearchInput`, `AdminStatusBadge` (`DemoBadge`),
  `AdminTimeline`.
- System states: `AdminEmptyState`, `AdminLoadingState`, `AdminErrorState`.
- Interaction: `AdminDrawer`, `AdminModal`, `AdminConfirmationDialog`.
- Guardrail notices: `PreviewModeBanner`, `FeatureDisabledNotice`,
  `PermissionNotice`.

## Data types

Location: `src/admin/types/`

- `admin.ts` — `DemoRecord`, `AdminRole`, `AdminOperator`, `StatusTone`.
- `content.ts` — `ContentPage`, `ContentStatus`.
- `events.ts` — `AdminEvent`, `AdminExperience`.
- `bookings.ts` — `AdminBooking`, `AdminTicket`.
- `payments.ts` — `AdminPayment`.
- `enquiries.ts` — `AdminEnquiry`.
- `sos.ts` — `AdminSosAlert`, `SosStatus`, `SosCategory`.
- `users.ts` — `AdminUser`.

Every record type that describes operational data extends `DemoRecord`, so
`isDemo: true` is required at compile time.

## Services

Location: `src/admin/services/`

- `admin-service.ts` — interface `AdminService` with narrow per-module
  service interfaces (`DashboardService`, `BookingService`, `TicketService`,
  `EnquiryService`, `PaymentService`, `SosService`, `ContentService`,
  `ExperienceService`, `EventService`, `UserService`).
- `mock-admin-service.ts` — in-memory implementation that reads from the
  mock arrays in `src/admin/mock/`. Route components import
  `adminService` from `@/admin/services` — never the mock arrays directly.

## Demonstration data

Location: `src/admin/mock/` (bookings, content, enquiries, events,
payments, sos, users). Every operational record has `isDemo: true`.

## Feature flags

`src/config/project-status.ts` exports `projectStatus`:

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

`PreviewModeBanner` only renders when `contentMode === "preview"`.

## Production functions deliberately disabled

- Real authentication and admin login.
- Real payments (Paystack, Flutterwave, Stripe, none connected).
- Real email, SMS, WhatsApp delivery.
- Real ticket QR issuance and validation.
- Live geolocation transmission and live SOS dispatch.
- Real property (Stay & Own) transactions.
- Cloud media uploads.

## Public site — preserved

The public routes (`/`, `/about`, `/discover`, `/experiences`, `/events`,
`/plan`, `/learn`, `/oriki`, `/tickets`, `/stay`, `/ceremonies`,
`/contact`, `/faq`, `/sos`) and their layout components
(`SiteHeader`, `SiteFooter`, `MobileBottomBar`) are unchanged.
`src/routes/__root.tsx` still hides them on `/admin` routes — this
separation was already in place before Phase 1 and was preserved.

No public route was modified in Phase 1.

## Deployment-controlled files — not modified

- `app.cjs`
- `vite.config.cpanel.ts`
- `.github/workflows/cpanel-preview.yml`
- `deploy/cpanel/yhp-preview.htaccess`

## Known limitations (Phase 1)

- Only `/admin`, `/admin/` and `/admin/sos` are wired to real components;
  the remaining sidebar entries route to not-found until Phase 2–4.
- Loading states are simple placeholders (no TanStack Query wiring yet);
  Phase 2 will introduce query-backed loaders.
- Forms are demonstration-only. No writes occur.
- Authorisation gates in the UI are cosmetic — real authorisation will be
  enforced server-side by Codex.

## Files Codex will replace when connecting MySQL

- `src/admin/services/mock-admin-service.ts` — replace with a server-side
  repository-backed implementation of the `AdminService` interface.
- `src/admin/mock/*` — remove once real data is available.
- `src/config/project-status.ts` — flip flags as production integrations
  come online.

## Recommended next backend implementation task

**Implement MySQL database foundations, environment validation, migrations
and server-side repository interfaces without changing the approved admin
interface.**
