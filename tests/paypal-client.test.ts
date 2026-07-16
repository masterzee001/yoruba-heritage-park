import { describe, expect, test } from "bun:test";

import {
  buildPayPalOrderDraft,
  createPayPalOrder,
  requestPayPalAccessToken,
  resolvePayPalBaseUrl,
  resolvePayPalConfiguration,
} from "../src/server/payments";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../src/server/repositories/repository-types";

describe("PayPal client foundation", () => {
  test("resolves sandbox and live base URLs", () => {
    expect(resolvePayPalBaseUrl("sandbox")).toBe("https://api-m.sandbox.paypal.com");
    expect(resolvePayPalBaseUrl("live")).toBe("https://api-m.paypal.com");
  });

  test("resolves credentials from provider settings and environment", () => {
    const configuration = resolvePayPalConfiguration(
      makeProviderSettings({
        publicKey: "client-from-provider",
        secretReference: "PAYPAL_SECRET_KEY",
      }),
      {
        PAYPAL_ENVIRONMENT: "sandbox",
        PAYPAL_SECRET_KEY: "secret-from-env",
      },
    );

    expect(configuration).toMatchObject({
      ok: true,
      missingConfiguration: [],
      credentials: {
        environment: "sandbox",
        clientId: "client-from-provider",
        secretKey: "secret-from-env",
      },
    });
  });

  test("falls back to PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY", () => {
    const configuration = resolvePayPalConfiguration(makeProviderSettings(), {
      PAYPAL_CLIENT_ID: "client-from-env",
      PAYPAL_SECRET_KEY: "secret-from-env",
    });

    expect(configuration).toMatchObject({
      ok: true,
      credentials: {
        environment: "sandbox",
        clientId: "client-from-env",
        secretKey: "secret-from-env",
      },
    });
  });

  test("reports missing credentials without exposing secret values", () => {
    const configuration = resolvePayPalConfiguration(
      makeProviderSettings({
        publicKey: null,
        secretReference: "PAYPAL_SECRET_KEY",
      }),
      {},
    );

    expect(configuration).toEqual({
      ok: false,
      missingConfiguration: ["PayPal client ID", "PAYPAL_SECRET_KEY environment value"],
    });
  });

  test("builds a checkout order draft without creating checkout publicly", () => {
    expect(
      buildPayPalOrderDraft(
        makePaymentRecord({
          amountMinor: 2500,
          currency: "USD",
          reference: "YHP-PAY-USD",
        }),
      ),
    ).toEqual({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: "YHP-PAY-USD",
          amount: {
            currency_code: "USD",
            value: "25.00",
          },
          description: "Yoruba Heritage Park payment request",
          custom_id: "pay_test",
        },
      ],
    });
  });

  test("adds return URLs to PayPal order drafts when configured", () => {
    expect(
      buildPayPalOrderDraft(makePaymentRecord(), {
        successUrl: "https://example.test/tickets",
        cancelUrl: "https://example.test/tickets",
      }),
    ).toMatchObject({
      application_context: {
        return_url:
          "https://example.test/tickets?checkout=success&paymentReference=YHP-PAY-TEST&provider=paypal",
        cancel_url:
          "https://example.test/tickets?checkout=cancelled&paymentReference=YHP-PAY-TEST&provider=paypal",
      },
    });
  });

  test("uses injected fetch client for token and order requests", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const client = {
      async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
        const url = String(input);
        calls.push({ url, init });
        if (url.endsWith("/v1/oauth2/token")) {
          return Response.json({ access_token: "token", token_type: "Bearer" });
        }
        return Response.json({ id: "ORDER-123", status: "CREATED" });
      },
    };

    const credentials = {
      environment: "sandbox" as const,
      clientId: "client",
      secretKey: "secret",
    };

    const token = await requestPayPalAccessToken(credentials, client);
    expect(token.access_token).toBe("token");

    const order = await createPayPalOrder(credentials, makePaymentRecord(), client);

    expect(order).toMatchObject({ id: "ORDER-123", status: "CREATED" });
    expect(calls.map((call) => call.url)).toEqual([
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    ]);
    expect(String(calls[2].init?.body)).toContain("YHP-PAY-TEST");
  });
});

function makeProviderSettings(
  overrides: Partial<PaymentProviderSettingsRecord> = {},
): PaymentProviderSettingsRecord {
  return {
    id: "pay_provider_test",
    providerCode: "paypal",
    displayName: "PayPal",
    mode: "test",
    enabled: true,
    publicKey: null,
    secretReference: null,
    currency: "NGN",
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
    amountMinor: 500000,
    currency: "NGN",
    providerCode: "paypal",
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
