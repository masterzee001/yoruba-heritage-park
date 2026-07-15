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
});

function makePaymentsRepository(
  options: {
    providers?: PaymentProviderSettingsRecord[];
  } = {},
): PaymentsRepository {
  const providers = options.providers ?? [];
  const payments: PaymentRecord[] = [];
  return {
    async list() {
      return payments;
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
