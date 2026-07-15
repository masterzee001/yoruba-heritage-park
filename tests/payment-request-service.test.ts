import { describe, expect, test } from "bun:test";

import { PaymentRequestService } from "../src/server/payments";
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

describe("payment request service", () => {
  test("rejects missing or ambiguous payment targets", async () => {
    const service = new PaymentRequestService(makePaymentsRepository(), {});

    expect(
      await service.prepare({
        payerName: "Visitor",
        amountMinor: 500000,
        providerCode: "paypal",
      }),
    ).toMatchObject({
      ok: false,
      message: "Payment request must reference one booking or one campaign.",
    });

    expect(
      await service.prepare({
        bookingId: "booking_1",
        campaignId: "campaign_1",
        payerName: "Visitor",
        amountMinor: 500000,
        providerCode: "paypal",
      }),
    ).toMatchObject({
      ok: false,
      message: "Payment request must reference one booking or one campaign.",
    });
  });

  test("blocks incomplete provider setup", async () => {
    const service = new PaymentRequestService(
      makePaymentsRepository({
        providers: [
          makeProviderSettings({
            providerCode: "paypal",
            displayName: "PayPal",
            enabled: true,
            publicKey: null,
            secretReference: "PAYPAL_SECRET_KEY",
          }),
        ],
      }),
      {},
    );

    const result = await service.prepare({
      bookingId: "booking_1",
      payerName: "Visitor",
      amountMinor: 500000,
      providerCode: "paypal",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missingConfiguration).toContain("PayPal client ID");
      expect(result.missingConfiguration).toContain("PAYPAL_SECRET_KEY environment value");
    }
  });

  test("creates a pending payment record without checkout availability", async () => {
    const repository = makePaymentsRepository({
      providers: [
        makeProviderSettings({
          providerCode: "paypal",
          displayName: "PayPal",
          enabled: true,
          publicKey: "paypal-client-id",
          secretReference: "PAYPAL_SECRET_KEY",
        }),
      ],
    });
    const service = new PaymentRequestService(repository, { PAYPAL_SECRET_KEY: "secret-value" });

    const result = await service.prepare({
      bookingId: "booking_1",
      payerName: "Visitor Name",
      payerEmail: "visitor@example.test",
      amountMinor: 500000,
      providerCode: "paypal",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checkoutAvailable).toBe(false);
      expect(result.payment.reference).toStartWith("YHP-PAY-");
      expect(result.payment.bookingId).toBe("booking_1");
      expect(result.payment.providerCode).toBe("paypal");
      expect(result.payment.status).toBe("pending");
      expect(result.payment.providerTransactionReference).toBeNull();
      expect(result.payment.metadataJson).toMatchObject({
        adapterCode: "paypal_rest_preview",
        checkoutAvailable: false,
        liveCaptureEnabled: false,
      });
    }
  });

  test("supports USD payment requests for international visitors", async () => {
    const repository = makePaymentsRepository({
      providers: [
        makeProviderSettings({
          providerCode: "paypal",
          displayName: "PayPal",
          enabled: true,
          publicKey: "paypal-client-id",
          secretReference: "PAYPAL_SECRET_KEY",
          currency: "USD",
        }),
      ],
    });
    const service = new PaymentRequestService(repository, { PAYPAL_SECRET_KEY: "secret-value" });

    const result = await service.prepare({
      campaignId: "campaign_1",
      payerName: "International Visitor",
      payerEmail: "visitor@example.test",
      amountMinor: 2500,
      currency: "USD",
      providerCode: "paypal",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payment.currency).toBe("USD");
      expect(result.payment.amountMinor).toBe(2500);
      expect(result.checkoutAvailable).toBe(false);
    }
  });

  test("rejects unsupported currencies", async () => {
    const service = new PaymentRequestService(makePaymentsRepository(), {});

    expect(
      await service.prepare({
        bookingId: "booking_1",
        payerName: "Visitor",
        amountMinor: 500000,
        currency: "EUR",
        providerCode: "paypal",
      }),
    ).toMatchObject({ ok: false, message: "Payment currency must be NGN or USD." });
  });

  test("prevents duplicate open booking payment requests", async () => {
    const existingPayment = makePaymentRecord({
      reference: "YHP-PAY-EXISTING",
      bookingId: "booking_1",
      status: "pending",
    });
    const service = new PaymentRequestService(
      makePaymentsRepository({
        providers: [
          makeProviderSettings({
            providerCode: "paypal",
            displayName: "PayPal",
            enabled: true,
            publicKey: "paypal-client-id",
            secretReference: "PAYPAL_SECRET_KEY",
          }),
        ],
        payments: [existingPayment],
      }),
      { PAYPAL_SECRET_KEY: "secret-value" },
    );

    const result = await service.prepare({
      bookingId: "booking_1",
      payerName: "Visitor Name",
      amountMinor: 500000,
      providerCode: "paypal",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Booking already has an open payment request: YHP-PAY-EXISTING.");
    }
  });
});

function makePaymentsRepository(
  options: {
    providers?: PaymentProviderSettingsRecord[];
    payments?: PaymentRecord[];
  } = {},
): PaymentsRepository {
  const providers = options.providers ?? [];
  const payments: PaymentRecord[] = [...(options.payments ?? [])];
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
    async create(input: CreatePaymentRecordInput) {
      const payment: PaymentRecord = {
        id: `pay_${payments.length + 1}`,
        reference: input.reference,
        bookingId: input.bookingId ?? null,
        campaignId: input.campaignId ?? null,
        payerName: input.payerName,
        payerEmail: input.payerEmail ?? null,
        amountMinor: input.amountMinor,
        currency: input.currency,
        providerCode: input.providerCode,
        providerTransactionReference: input.providerTransactionReference ?? null,
        status: input.status ?? "pending",
        verificationStatus: input.verificationStatus ?? "unverified",
        refundStatus: input.refundStatus ?? "none",
        metadataJson: input.metadataJson ?? {},
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      };
      payments.push(payment);
      return payment;
    },
    async updateCheckoutPreparation(): Promise<PaymentRecord> {
      throw new Error("Not implemented in test repository.");
    },
    async upsertProviderSettings(
      _input: UpsertPaymentProviderSettingsInput,
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

function makePaymentRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "pay_existing",
    reference: "YHP-PAY-TEST",
    bookingId: null,
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

function makeProviderSettings(
  overrides: Partial<PaymentProviderSettingsRecord> = {},
): PaymentProviderSettingsRecord {
  return {
    id: "pay_provider_test",
    providerCode: "pending_configuration",
    displayName: "Pending provider configuration",
    mode: "test",
    enabled: false,
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
