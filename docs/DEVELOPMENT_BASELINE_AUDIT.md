# Development Baseline Audit

## Routes Audited

- `/`
- `/about`
- `/discover`
- `/discover/$slug`
- `/experiences`
- `/experiences/$slug`
- `/events`
- `/events/$slug`
- `/plan`
- `/tickets`
- `/learn`
- `/oriki`
- `/ceremonies`
- `/stay`
- `/contact`
- `/faq`
- `/sos`
- `/admin`
- `/admin/sos`

Main public navigation destinations load through the existing TanStack route tree. Detail-page
links are backed by the current `EXPERIENCES`, `EVENTS`, and Discover subject slugs. Admin sidebar
destinations without implemented routes are displayed as disabled items instead of links.

## Encoding Problems Found

Corrected mojibake and symbol corruption in source files, including:

- corrupted spellings of `Yorùbá`, `Oríkì`, and uppercase `ORÍKÌ`
- broken em dashes and arrows to `—`, `→`, and `←`
- broken `₦`, `©`, and `·` symbols
- corrupted Yorùbá names including `Ṣàngó`, `Ijèbú`, `Olóde`, `Àyìn`, and `Olódùmarè`

The `<meta charset="utf-8">` configuration remains in place. A source-integrity check was added at
`scripts/check-text-integrity.mjs` and exposed through `bun run check:text-integrity`.

## Visible Prototype Wording Changed

- Public ticketing copy now says online payment is not active and no booking/payment record is
  created.
- Ticket confirmation, QR placeholder, mock pricing, and fake reference copy were replaced with a
  pending request summary.
- Visitor SOS now displays a preview-mode warning and disables live alert behavior while
  `sosLiveEnabled` is false.
- Public event, experience, Discover, Learn, Plan, Contact, Ceremony, Oríkì, Stay, footer, and
  homepage copy now uses pending operational/cultural confirmation wording instead of visible
  mock/prototype/sample labels.
- Public schedule, duration, availability, and pricing data were changed to pending/enquiry wording.
- Admin dashboard keeps demonstration data but now displays a clear non-production banner.

## Links Or Controls Corrected

- Header and footer ticket CTAs use neutral ticket-detail wording instead of implying active payment.
- Plan page ride booking is disabled and labelled pending.
- Ticket page payment controls are gated by `projectStatus.paymentEnabled`.
- SOS page live alert controls are gated by `projectStatus.sosLiveEnabled`.
- Admin links for unimplemented sections are disabled to avoid internal 404 links.
- Mobile bottom bar remains present and root layout retains bottom padding for mobile content.

## Project Status Flags Added

Added `src/config/project-status.ts` with safe defaults:

- `contentMode: "preview"`
- `bookingEnabled: false`
- `paymentEnabled: false`
- `sosLiveEnabled: false`
- `showPendingInformation: true`

These flags now drive public ticket/payment behavior, SOS live-state behavior, and the admin
non-production banner.

## Remaining Mock Systems

- `src/lib/mock-data.ts` still provides preview content arrays for navigation, experiences, events,
  huts, ticket types, and SOS categories.
- Admin overview and SOS console data remain demonstration-only.
- Forms do not submit to a backend.
- Booking, payment, authentication, database persistence, live SOS dispatch, and admin modules are
  not implemented.

## Known Risks

- Public content still requires final cultural, operational, pricing, schedule, and legal approval.
- Some public CTAs lead to pending-state forms rather than live services.
- No end-to-end browser automation exists yet; validation is currently lint, source-integrity, and
  production build based.
- The app still uses local demonstration data until a server-side repository layer is introduced.

## Recommended Next Implementation Task

MySQL database foundation, environment validation and server-side repository layer
