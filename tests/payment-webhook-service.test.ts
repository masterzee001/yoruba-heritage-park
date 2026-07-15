import { describe, expect, test } from "bun:test";

import { PaymentWebhookService } from "../src/server/payments";
import type {
  CreatePaymentRecordInput,
  PaymentsRepository,
  RecordPaymentWebhookEventInput,
  UpsertDonationCampaignInput,
  UpsertPaymentProviderSettingsInput,
} from "../src/server/repositories/payments-repository";
import type {
  DonationCampaignRecord,
  PaymentProviderSettingsRecord,
  PaymentRecord,
  PaymentWebhookEventRecord,
} from "../src/server/repositories/repository-types";

describe("payment webhook service", () => {
  test("rejects malformed PayPal webhook payloads before persistence", async () => {
    const repository = makePaymentsRepository();
    const service = new PaymentWebhookService(repository);

    expect(await service.record({ providerCode: "paypal", payload: {} })).toEqual({
      ok: false,
      message: "Webhook payload is missing PayPal event identity.",
    });
    expect(repository.events).toEqual([]);
  });

  test("records PayPal webhook events for manual review without changing payment status", async () => {
    const payment = makePaymentRecord({ providerTransactionReference: "ORDER-123" });
    const repository = makePaymentsRepository({ payments: [payment] });
    const service = new PaymentWebhookService(repository);

    const result = await service.record({
      providerCode: "paypal",
      payload: {
        id: "WH-123",
        event_type: "CHECKOUT.ORDER.APPROVED",
        resource: {
          id: "ORDER-123",
          purchase_units: [{ reference_id: "YHP-PAY-TEST" }],
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      matchedPayment: { reference: "YHP-PAY-TEST", status: "pending" },
      message: "Payment webhook recorded for review. Payment status was not changed.",
    });
    expect(repository.events).toHaveLength(1);
    expect(repository.events[0]).toMatchObject({
      providerCode: "paypal",
      providerEventId: "WH-123",
      eventType: "CHECKOUT.ORDER.APPROVED",
      paymentId: "pay_test",
      paymentReference: "YHP-PAY-TEST",
      processingStatus: "review_required",
      verificationStatus: "unverified",
    });
    expect(payment.status).toBe("pending");
  });

  test("records unmatched PayPal webhook events without assuming success", async () => {
    const repository = makePaymentsRepository();
    const service = new PaymentWebhookService(repository);

    const result = await service.record({
      providerCode: "paypal",
      payload: {
        id: "WH-UNMATCHED",
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: { id: "CAPTURE-UNMATCHED" },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      matchedPayment: null,
      message: "Payment webhook recorded. No local payment match was found.",
    });
    expect(repository.events[0]).toMatchObject({
      paymentId: null,
      paymentReference: null,
      processingStatus: "received",
      verificationStatus: "unverified",
    });
  });

  test("records verified Paystack webhook events for manual review", async () => {
    const payment = makePaymentRecord({
      providerCode: "paystack",
      providerTransactionReference: "YHP-PAY-TEST",
    });
    const repository = makePaymentsRepository({ payments: [payment] });
    const service = new PaymentWebhookService(repository);

    const result = await service.record({
      providerCode: "paystack",
      signatureVerification: {
        ok: true,
        providerCode: "paystack",
        scheme: "hmac-sha512",
      },
      payload: {
        event: "charge.success",
        data: {
          id: 123456,
          reference: "YHP-PAY-TEST",
          metadata: { paymentReference: "YHP-PAY-TEST" },
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      matchedPayment: { reference: "YHP-PAY-TEST", status: "pending" },
    });
    expect(repository.events[0]).toMatchObject({
      providerCode: "paystack",
      providerEventId: "YHP-PAY-TEST",
      eventType: "charge.success",
      paymentId: "pay_test",
      paymentReference: "YHP-PAY-TEST",
      processingStatus: "review_required",
      verificationStatus: "verified",
    });
    expect(repository.events[0].payloadJson).toMatchObject({
      yhpProcessing: {
        signatureVerification: { ok: true, providerCode: "paystack" },
        statusMutationApplied: false,
      },
    });
    expect(payment.status).toBe("pending");
  });

  test("records failed Stripe signature verification without changing payment status", async () => {
    const payment = makePaymentRecord({
      providerCode: "stripe",
      providerTransactionReference: "cs_test_123",
    });
    const repository = makePaymentsRepository({ payments: [payment] });
    const service = new PaymentWebhookService(repository);

    const result = await service.record({
      providerCode: "stripe",
      signatureVerification: {
        ok: false,
        providerCode: "stripe",
        scheme: "stripe-v1",
        reason: "Stripe webhook signature mismatch.",
      },
      payload: {
        id: "evt_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            client_reference_id: "YHP-PAY-TEST",
            metadata: { paymentReference: "YHP-PAY-TEST" },
          },
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      matchedPayment: { reference: "YHP-PAY-TEST", status: "pending" },
    });
    expect(repository.events[0]).toMatchObject({
      providerCode: "stripe",
      providerEventId: "evt_123",
      eventType: "checkout.session.completed",
      paymentId: "pay_test",
      paymentReference: "YHP-PAY-TEST",
      processingStatus: "review_required",
      verificationStatus: "failed",
    });
    expect(payment.status).toBe("pending");
  });
});

interface TestPaymentsRepository extends PaymentsRepository {
  readonly events: PaymentWebhookEventRecord[];
}

function makePaymentsRepository(
  options: {
    payments?: PaymentRecord[];
  } = {},
): TestPaymentsRepository {
  const payments = options.payments ?? [makePaymentRecord()];
  const events: PaymentWebhookEventRecord[] = [];
  return {
    events,
    async list() {
      return payments;
    },
    async findByReference(reference: string) {
      return payments.find((payment) => payment.reference === reference) ?? null;
    },
    async findByProviderTransactionReference(providerCode, providerTransactionReference) {
      return (
        payments.find(
          (payment) =>
            payment.providerCode === providerCode &&
            payment.providerTransactionReference === providerTransactionReference,
        ) ?? null
      );
    },
    async listForBooking(bookingId: string) {
      return payments.filter((payment) => payment.bookingId === bookingId);
    },
    async listProviderSettings(): Promise<PaymentProviderSettingsRecord[]> {
      return [];
    },
    async listDonationCampaigns(): Promise<DonationCampaignRecord[]> {
      return [];
    },
    async listWebhookEvents(): Promise<PaymentWebhookEventRecord[]> {
      return events;
    },
    async recordWebhookEvent(
      input: RecordPaymentWebhookEventInput,
    ): Promise<PaymentWebhookEventRecord> {
      const existingIndex = events.findIndex(
        (event) =>
          event.providerCode === input.providerCode &&
          event.providerEventId === input.providerEventId,
      );
      const event: PaymentWebhookEventRecord = {
        id: existingIndex >= 0 ? events[existingIndex].id : `pay_webhook_${events.length + 1}`,
        providerCode: input.providerCode,
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        paymentId: input.paymentId ?? null,
        paymentReference: input.paymentReference ?? null,
        processingStatus: input.processingStatus ?? "received",
        verificationStatus: input.verificationStatus ?? "unverified",
        payloadJson: input.payloadJson,
        receivedAt: new Date("2026-01-01T00:00:00.000Z"),
        processedAt: null,
      };
      if (existingIndex >= 0) events[existingIndex] = event;
      else events.push(event);
      return event;
    },
    async create(_input: CreatePaymentRecordInput): Promise<PaymentRecord> {
      throw new Error("Not implemented in test repository.");
    },
    async updateCheckoutPreparation(): Promise<PaymentRecord> {
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
