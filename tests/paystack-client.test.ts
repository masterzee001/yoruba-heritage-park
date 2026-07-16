import { describe, expect, test } from "bun:test";

import {
  buildPaystackTransactionInitializeDraft,
  initializePaystackTransaction,
  resolvePaystackConfiguration,
} from "../src/server/payments";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../src/server/repositories/repository-types";

describe("Paystack client foundation", () => {
  test("resolves credentials from provider settings and environment", () => {
    const configuration = resolvePaystackConfiguration(
      makeProviderSettings({
        publicKey: "pk_test_provider",
        secretReference: "PAYSTACK_SECRET_KEY",
      }),
      { PAYSTACK_SECRET_KEY: "secret-from-env" },
    );

    expect(configuration).toEqual({
      ok: true,
      credentials: {
        publicKey: "pk_test_provider",
        secretKey: "secret-from-env",
      },
      missingConfiguration: [],
    });
  });

  test("reports missing credentials without exposing secret values", () => {
    const configuration = resolvePaystackConfiguration(
      makeProviderSettings({
        publicKey: null,
        secretReference: "PAYSTACK_SECRET_KEY",
      }),
      {},
    );

    expect(configuration).toEqual({
      ok: false,
      missingConfiguration: ["Paystack public key", "PAYSTACK_SECRET_KEY environment value"],
    });
  });

  test("builds a transaction initialization draft in subunits", () => {
    expect(
      buildPaystackTransactionInitializeDraft(makePaymentRecord(), {
        callbackUrl: "https://example.test/tickets",
      }),
    ).toEqual({
      email: "visitor@example.test",
      amount: 500000,
      currency: "NGN",
      reference: "YHP-PAY-TEST",
      metadata: {
        paymentId: "pay_test",
        paymentReference: "YHP-PAY-TEST",
        source: "yoruba_heritage_park",
      },
      callback_url:
        "https://example.test/tickets?checkout=success&paymentReference=YHP-PAY-TEST&provider=paystack",
    });
  });

  test("uses injected fetch client for transaction initialization", async () => {
    const fetchCalls: Array<{ url: string; body: string }> = [];
    const client = {
      async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
        fetchCalls.push({ url: String(input), body: String(init?.body) });
        return Response.json({
          status: true,
          message: "Authorization URL created",
          data: {
            authorization_url: "https://checkout.paystack.com/access-code",
            access_code: "access-code",
            reference: "YHP-PAY-TEST",
          },
        });
      },
    };

    const response = await initializePaystackTransaction(
      {
        publicKey: "pk_test",
        secretKey: "sk_test",
        callbackUrl: "https://example.test/tickets",
      },
      makePaymentRecord(),
      client,
    );

    expect(fetchCalls[0].url).toBe("https://api.paystack.co/transaction/initialize");
    expect(JSON.parse(fetchCalls[0].body)).toMatchObject({
      callback_url:
        "https://example.test/tickets?checkout=success&paymentReference=YHP-PAY-TEST&provider=paystack",
    });
    expect(response.data?.authorization_url).toBe("https://checkout.paystack.com/access-code");
  });
});

function makeProviderSettings(
  overrides: Partial<PaymentProviderSettingsRecord> = {},
): PaymentProviderSettingsRecord {
  return {
    id: "pay_provider_paystack",
    providerCode: "paystack",
    displayName: "Paystack",
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
    providerCode: "paystack",
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
