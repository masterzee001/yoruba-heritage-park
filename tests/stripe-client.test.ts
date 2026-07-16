import { describe, expect, test } from "bun:test";

import {
  buildStripeCheckoutSessionDraft,
  createStripeCheckoutSession,
  resolveStripeConfiguration,
} from "../src/server/payments";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../src/server/repositories/repository-types";

describe("Stripe client foundation", () => {
  test("resolves credentials from provider settings, configuration, and environment", () => {
    const result = resolveStripeConfiguration(
      makeProviderSettings({
        publicKey: "pk_test_stripe",
        secretReference: "STRIPE_SECRET_KEY",
        configurationJson: {
          successUrl: "https://example.test/payments/success",
          cancelUrl: "https://example.test/payments/cancel",
        },
      }),
      { STRIPE_SECRET_KEY: "secret-value" },
    );

    expect(result).toEqual({
      ok: true,
      credentials: {
        publishableKey: "pk_test_stripe",
        secretKey: "secret-value",
        successUrl: "https://example.test/payments/success",
        cancelUrl: "https://example.test/payments/cancel",
      },
      missingConfiguration: [],
    });
  });

  test("reports missing checkout URLs without exposing secret values", () => {
    const result = resolveStripeConfiguration(
      makeProviderSettings({
        publicKey: "pk_test_stripe",
        secretReference: "STRIPE_SECRET_KEY",
      }),
      { STRIPE_SECRET_KEY: "secret-value" },
    );

    expect(result).toEqual({
      ok: false,
      missingConfiguration: ["Stripe checkout success URL", "Stripe checkout cancel URL"],
    });
  });

  test("builds a checkout session draft in subunits", () => {
    const draft = buildStripeCheckoutSessionDraft(makePaymentRecord(), {
      publishableKey: "pk_test_stripe",
      secretKey: "secret-value",
      successUrl: "https://example.test/payments/success",
      cancelUrl: "https://example.test/payments/cancel",
    });

    expect(draft).toEqual({
      mode: "payment",
      successUrl:
        "https://example.test/payments/success?checkout=success&paymentReference=YHP-PAY-TEST&provider=stripe",
      cancelUrl:
        "https://example.test/payments/cancel?checkout=cancelled&paymentReference=YHP-PAY-TEST&provider=stripe",
      clientReferenceId: "YHP-PAY-TEST",
      customerEmail: "visitor@example.test",
      currency: "usd",
      unitAmount: 12500,
      productName: "Yoruba Heritage Park payment request",
      metadata: {
        paymentId: "pay_test",
        paymentReference: "YHP-PAY-TEST",
        source: "yoruba_heritage_park",
      },
    });
  });

  test("uses injected fetch client for checkout session creation", async () => {
    const fetchCalls: Array<{ url: string; body: string }> = [];
    const session = await createStripeCheckoutSession(
      {
        publishableKey: "pk_test_stripe",
        secretKey: "secret-value",
        successUrl: "https://example.test/payments/success",
        cancelUrl: "https://example.test/payments/cancel",
      },
      makePaymentRecord(),
      {
        async fetch(input, init): Promise<Response> {
          fetchCalls.push({
            url: String(input),
            body: String(init?.body),
          });
          return Response.json({
            id: "cs_test_123",
            object: "checkout.session",
            url: "https://checkout.stripe.com/c/pay/cs_test_123",
            livemode: false,
          });
        },
      },
    );

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(fetchCalls[0].body).toContain("mode=payment");
    expect(fetchCalls[0].body).toContain("client_reference_id=YHP-PAY-TEST");
    expect(fetchCalls[0].body).toContain("checkout%3Dsuccess");
    expect(fetchCalls[0].body).toContain("checkout%3Dcancelled");
    expect(session.id).toBe("cs_test_123");
  });
});

function makeProviderSettings(
  overrides: Partial<PaymentProviderSettingsRecord> = {},
): PaymentProviderSettingsRecord {
  return {
    id: "pay_provider_test",
    providerCode: "stripe",
    displayName: "Stripe",
    mode: "test",
    enabled: true,
    publicKey: null,
    secretReference: null,
    currency: "USD",
    minimumAmountMinor: 0,
    configurationJson: {},
    updatedByUserId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makePaymentRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "pay_test",
    reference: "YHP-PAY-TEST",
    bookingId: "booking_test",
    campaignId: null,
    payerName: "Visitor Name",
    payerEmail: "visitor@example.test",
    amountMinor: 12500,
    currency: "USD",
    providerCode: "stripe",
    providerTransactionReference: null,
    status: "pending",
    verificationStatus: "unverified",
    refundStatus: "none",
    metadataJson: {},
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}
