import { describe, expect, test } from "bun:test";

import { PaymentCheckoutService } from "../src/server/payments";
import type {
  CreatePaymentRecordInput,
  PaymentsRepository,
  UpsertDonationCampaignInput,
  UpsertPaymentProviderSettingsInput,
} from "../src/server/repositories/payments-repository";
import type {
  DonationCampaignRecord,
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../src/server/repositories/repository-types";

describe("payment checkout service", () => {
  test("keeps checkout disabled until payment launch is enabled", async () => {
    const fetchCalls: string[] = [];
    const service = new PaymentCheckoutService(makePaymentsRepository(), {
      paymentEnabled: false,
      paypalClient: makePayPalClient(fetchCalls),
    });

    const result = await service.prepare({ paymentReference: "YHP-PAY-TEST" });

    expect(result).toEqual({
      ok: false,
      message: "Online checkout is not active yet. The payment request remains for review.",
    });
    expect(fetchCalls).toEqual([]);
  });

  test("creates a PayPal sandbox checkout order for a pending payment", async () => {
    const fetchCalls: string[] = [];
    const service = new PaymentCheckoutService(makePaymentsRepository(), {
      paymentEnabled: true,
      env: {
        PAYPAL_ENVIRONMENT: "sandbox",
        PAYPAL_SECRET_KEY: "secret-value",
      },
      paypalClient: makePayPalClient(fetchCalls),
    });

    const result = await service.prepare({ paymentReference: "yhp-pay-test" });

    expect(result).toEqual({
      ok: true,
      providerCode: "paypal",
      paymentReference: "YHP-PAY-TEST",
      providerOrderId: "ORDER-123",
      checkoutUrl: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123",
      sandbox: true,
      message: "PayPal sandbox checkout order prepared.",
    });
    expect(fetchCalls).toEqual([
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    ]);
  });

  test("blocks live checkout unless live capture is explicitly allowed", async () => {
    const service = new PaymentCheckoutService(
      makePaymentsRepository({
        providers: [
          makeProviderSettings({
            mode: "live",
            publicKey: "paypal-client-id",
            secretReference: "PAYPAL_SECRET_KEY",
          }),
        ],
      }),
      {
        paymentEnabled: true,
        env: {
          PAYPAL_ENVIRONMENT: "live",
          PAYPAL_SECRET_KEY: "secret-value",
        },
        paypalClient: makePayPalClient([]),
      },
    );

    expect(await service.prepare({ paymentReference: "YHP-PAY-TEST" })).toEqual({
      ok: false,
      message: "Live payment capture is not enabled for this environment.",
    });
  });

  test("reports incomplete provider configuration", async () => {
    const service = new PaymentCheckoutService(
      makePaymentsRepository({
        providers: [
          makeProviderSettings({
            publicKey: null,
            secretReference: "PAYPAL_SECRET_KEY",
          }),
        ],
      }),
      { paymentEnabled: true, env: {} },
    );

    const result = await service.prepare({ paymentReference: "YHP-PAY-TEST" });

    expect(result).toEqual({
      ok: false,
      message: "Payment provider is not ready for checkout.",
      missingConfiguration: ["PayPal client ID", "PAYPAL_SECRET_KEY environment value"],
    });
  });

  test("rejects non-pending payment records", async () => {
    const service = new PaymentCheckoutService(
      makePaymentsRepository({
        payments: [makePaymentRecord({ status: "successful" })],
      }),
      { paymentEnabled: true },
    );

    expect(await service.prepare({ paymentReference: "YHP-PAY-TEST" })).toEqual({
      ok: false,
      message: "Only pending payment requests can start checkout.",
    });
  });
});

function makePayPalClient(fetchCalls: string[]) {
  return {
    async fetch(input: string | URL): Promise<Response> {
      const url = String(input);
      fetchCalls.push(url);
      if (url.endsWith("/v1/oauth2/token")) {
        return Response.json({ access_token: "token", token_type: "Bearer" });
      }
      return Response.json({
        id: "ORDER-123",
        status: "CREATED",
        links: [
          {
            href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123",
            rel: "approve",
            method: "GET",
          },
        ],
      });
    },
  };
}

function makePaymentsRepository(
  options: {
    providers?: PaymentProviderSettingsRecord[];
    payments?: PaymentRecord[];
  } = {},
): PaymentsRepository {
  const providers = options.providers ?? [
    makeProviderSettings({
      publicKey: "paypal-client-id",
      secretReference: "PAYPAL_SECRET_KEY",
    }),
  ];
  const payments = options.payments ?? [makePaymentRecord()];
  return {
    async list() {
      return payments;
    },
    async findByReference(reference: string) {
      return payments.find((payment) => payment.reference === reference) ?? null;
    },
    async listForBooking(bookingId: string) {
      return payments.filter((payment) => payment.bookingId === bookingId);
    },
    async listProviderSettings() {
      return providers;
    },
    async listDonationCampaigns(): Promise<DonationCampaignRecord[]> {
      return [];
    },
    async create(_input: CreatePaymentRecordInput): Promise<PaymentRecord> {
      throw new Error("Not implemented in test repository.");
    },
    async upsertProviderSettings(
      _input: UpsertPaymentProviderSettingsInput,
      _updatedByUserId: string,
    ): Promise<PaymentProviderSettingsRecord> {
      throw new Error("Not implemented in test repository.");
    },
    async upsertDonationCampaign(
      _input: UpsertDonationCampaignInput,
    ): Promise<DonationCampaignRecord> {
      throw new Error("Not implemented in test repository.");
    },
  };
}

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
