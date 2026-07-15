import { describe, expect, test } from "bun:test";

import { PaymentReconciliationService } from "../src/server/payments";
import type {
  ApplyWebhookPaymentSuccessInput,
  ApplyWebhookPaymentSuccessResult,
  PaymentReconciliationRepository,
} from "../src/server/payments/payment-reconciliation-service";
import type {
  PaymentRecord,
  PaymentWebhookEventRecord,
} from "../src/server/repositories/repository-types";

describe("payment reconciliation service", () => {
  test("applies a verified matched webhook to a pending payment", async () => {
    const repository = makeRepository();
    const result = await new PaymentReconciliationService(repository).applyVerifiedWebhookEvent(
      "pay_webhook_test",
      "user_admin",
    );

    expect(result).toMatchObject({
      ok: true,
      message:
        "Verified webhook applied. Payment marked successful and linked booking marked paid.",
    });
    expect(repository.appliedInput).toEqual({
      eventId: "pay_webhook_test",
      paymentId: "pay_test",
      appliedByUserId: "user_admin",
    });
  });

  test("rejects unverified webhook events", async () => {
    const repository = makeRepository({
      event: makeWebhookEvent({ verificationStatus: "failed" }),
    });

    await expect(
      new PaymentReconciliationService(repository).applyVerifiedWebhookEvent(
        "pay_webhook_test",
        "user_admin",
      ),
    ).resolves.toEqual({
      ok: false,
      message: "Only verified webhook events can be applied.",
    });
    expect(repository.appliedInput).toBeNull();
  });

  test("rejects already processed webhook events", async () => {
    const repository = makeRepository({
      event: makeWebhookEvent({ processingStatus: "processed" }),
    });

    await expect(
      new PaymentReconciliationService(repository).applyVerifiedWebhookEvent(
        "pay_webhook_test",
        "user_admin",
      ),
    ).resolves.toEqual({
      ok: false,
      message: "This webhook event has already been processed.",
    });
  });

  test("rejects webhook events without a local payment match", async () => {
    const repository = makeRepository({
      event: makeWebhookEvent({ paymentReference: null }),
    });

    await expect(
      new PaymentReconciliationService(repository).applyVerifiedWebhookEvent(
        "pay_webhook_test",
        "user_admin",
      ),
    ).resolves.toEqual({
      ok: false,
      message: "Webhook event is not matched to a local payment.",
    });
  });

  test("rejects non-pending matched payments", async () => {
    const repository = makeRepository({
      payment: makePaymentRecord({ status: "successful" }),
    });

    await expect(
      new PaymentReconciliationService(repository).applyVerifiedWebhookEvent(
        "pay_webhook_test",
        "user_admin",
      ),
    ).resolves.toEqual({
      ok: false,
      message: "Only pending payment records can be reconciled.",
    });
  });
});

interface TestPaymentReconciliationRepository extends PaymentReconciliationRepository {
  appliedInput: ApplyWebhookPaymentSuccessInput | null;
}

function makeRepository(
  options: {
    event?: PaymentWebhookEventRecord | null;
    payment?: PaymentRecord | null;
  } = {},
): TestPaymentReconciliationRepository {
  const event = options.event === undefined ? makeWebhookEvent() : options.event;
  const payment = options.payment === undefined ? makePaymentRecord() : options.payment;
  return {
    appliedInput: null,
    async findWebhookEventById(id) {
      return event?.id === id ? event : null;
    },
    async findByReference(reference) {
      return payment?.reference === reference ? payment : null;
    },
    async applyWebhookPaymentSuccess(input): Promise<ApplyWebhookPaymentSuccessResult> {
      this.appliedInput = input;
      return {
        payment: makePaymentRecord({
          status: "successful",
          verificationStatus: "preview_verified",
        }),
        event: makeWebhookEvent({ processingStatus: "processed" }),
        bookingPaymentStateApplied: true,
      };
    },
  };
}

function makeWebhookEvent(
  overrides: Partial<PaymentWebhookEventRecord> = {},
): PaymentWebhookEventRecord {
  return {
    id: "pay_webhook_test",
    providerCode: "paystack",
    providerEventId: "evt_test",
    eventType: "charge.success",
    paymentId: "pay_test",
    paymentReference: "YHP-PAY-TEST",
    processingStatus: "review_required",
    verificationStatus: "verified",
    payloadJson: {},
    receivedAt: new Date("2026-01-01T00:00:00.000Z"),
    processedAt: null,
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
    providerTransactionReference: "YHP-PAY-TEST",
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
