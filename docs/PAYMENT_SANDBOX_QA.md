# Payment Sandbox QA

Use this runbook before real payment testing. It checks configuration only; it does not call PayPal, Paystack, or Stripe APIs and it never prints secret values.

## Readiness Command

```bash
bun run payment:qa
```

Set this when running against preview or production so webhook callback URLs render as absolute URLs:

```bash
PAYMENT_PUBLIC_BASE_URL=https://yhp-preview.deedoc.org bun run payment:qa
```

On PowerShell:

```powershell
$env:PAYMENT_PUBLIC_BASE_URL = "https://yhp-preview.deedoc.org"; bun run payment:qa
```

## Required Sandbox Inputs

PayPal:

- `PAYPAL_ENVIRONMENT=sandbox`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET_KEY`
- `PAYPAL_WEBHOOK_ID` for webhook verification
- `PAYPAL_CHECKOUT_SUCCESS_URL` and `PAYPAL_CHECKOUT_CANCEL_URL`, or return URLs saved in admin provider configuration

Paystack:

- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_CHECKOUT_CALLBACK_URL`, or a return URL saved in admin provider configuration

Stripe:

- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CHECKOUT_SUCCESS_URL` and `STRIPE_CHECKOUT_CANCEL_URL`, or return URLs saved in admin provider configuration

## Launch Flags

- `PAYMENT_CHECKOUT_ENABLED=true` is required before checkout links can be created.
- `PAYMENT_ALLOW_LIVE_CAPTURE=false` should remain locked during sandbox testing.
- `PAYMENT_ALLOW_LIVE_CAPTURE=true` should only be used for deliberate live payment testing.

The QA script fails if live capture is enabled accidentally. To confirm an intentional live test:

```bash
bun run payment:qa -- --allow-live-capture
```

## Manual Sandbox Flow

1. Configure provider settings in Admin > Payments.
2. Confirm the provider is enabled in test mode.
3. Confirm the callback URL shown in Admin > Payments is copied into the provider dashboard.
4. Create or select a booking in admin.
5. Prepare a payment link for PayPal, Paystack, and Stripe separately.
6. Open each sandbox checkout URL and complete a sandbox payment.
7. Confirm the return URL lands on `/tickets` with the payment reference.
8. Confirm the webhook appears in the admin webhook intake monitor.
9. Apply only verified matched webhook events.

Do not use live cards or live provider modes during this sandbox run.
