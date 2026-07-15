import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";

import { handlePaymentWebhookRequest } from "../src/server/payments/webhook-endpoint";
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

describe("payment webhook endpoint handlers", () => {
  test("records a verified PayPal webhook through the PayPal verification API", async () => {
    const rawBody = JSON.stringify({
      id: "WH-PAYPAL-TEST",
      event_type: "CHECKOUT.ORDER.APPROVED",
      resource: {
        id: "PAYPAL-ORDER-TEST",
        purchase_units: [{ reference_id: "YHP-PAY-TEST" }],
      },
    });
    const repository = makePaymentsRepository({
      providers: [
        makeProviderSettings({
          providerCode: "paypal",
          publicKey: "client_test",
          secretReference: "PAYPAL_SECRET_KEY",
        }),
      ],
      payments: [
        makePaymentRecord({
          providerCode: "paypal",
          providerTransactionReference: "PAYPAL-ORDER-TEST",
        }),
      ],
    });
    const paypalClient = {
      async fetch(input: string | URL) {
        const url = String(input);
        if (url.endsWith("/v1/oauth2/token")) {
          return Response.json({ access_token: "token_test", token_type: "Bearer" });
        }
        return Response.json({ verification_status: "SUCCESS" });
      },
    };

    const response = await handlePaymentWebhookRequest({
      providerCode: "paypal",
      request: new Request("https://example.test/api/payments/webhooks/paypal", {
        method: "POST",
        headers: {
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api-m.sandbox.paypal.com/certs/test",
          "paypal-transmission-id": "transmission-test",
          "paypal-transmission-sig": "signature-test",
          "paypal-transmission-time": "2026-01-01T00:00:00Z",
        },
        body: rawBody,
      }),
      paymentsRepository: repository,
      env: {
        PAYPAL_ENVIRONMENT: "sandbox",
        PAYPAL_SECRET_KEY: "secret_test",
        PAYPAL_WEBHOOK_ID: "WH-123",
      },
      paypalClient,
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      ok: true,
      matchedPaymentReference: "YHP-PAY-TEST",
      verificationStatus: "verified",
      statusMutationApplied: false,
    });
    expect(repository.events[0]).toMatchObject({
      providerCode: "paypal",
      providerEventId: "WH-PAYPAL-TEST",
      eventType: "CHECKOUT.ORDER.APPROVED",
      paymentReference: "YHP-PAY-TEST",
      verificationStatus: "verified",
      processingStatus: "review_required",
    });
  });

  test("records a verified Paystack webhook from the raw request body", async () => {
    const rawBody = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "YHP-PAY-TEST",
        metadata: { paymentReference: "YHP-PAY-TEST" },
      },
    });
    const secretKey = "sk_test_paystack";
    const signature = createHmac("sha512", secretKey).update(rawBody).digest("hex");
    const repository = makePaymentsRepository({
      providers: [
        makeProviderSettings({
          providerCode: "paystack",
          secretReference: "PAYSTACK_SECRET_KEY",
        }),
      ],
      payments: [
        makePaymentRecord({
          providerCode: "paystack",
          providerTransactionReference: "YHP-PAY-TEST",
        }),
      ],
    });

    const response = await handlePaymentWebhookRequest({
      providerCode: "paystack",
      request: new Request("https://example.test/api/payments/webhooks/paystack", {
        method: "POST",
        headers: { "x-paystack-signature": signature },
        body: rawBody,
      }),
      paymentsRepository: repository,
      env: { PAYSTACK_SECRET_KEY: secretKey },
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      ok: true,
      matchedPaymentReference: "YHP-PAY-TEST",
      verificationStatus: "verified",
      statusMutationApplied: false,
    });
    expect(repository.events[0]).toMatchObject({
      providerCode: "paystack",
      paymentReference: "YHP-PAY-TEST",
      verificationStatus: "verified",
      processingStatus: "review_required",
    });
  });

  test("records a failed Stripe signature as audit-only without confirming payment", async () => {
    const rawBody = JSON.stringify({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          client_reference_id: "YHP-PAY-TEST",
        },
      },
    });
    const repository = makePaymentsRepository({
      providers: [makeProviderSettings({ providerCode: "stripe" })],
      payments: [
        makePaymentRecord({
          providerCode: "stripe",
          providerTransactionReference: "cs_test_123",
        }),
      ],
    });

    const response = await handlePaymentWebhookRequest({
      providerCode: "stripe",
      request: new Request("https://example.test/api/payments/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "t=1785000000,v1=bad" },
        body: rawBody,
      }),
      paymentsRepository: repository,
      env: { STRIPE_WEBHOOK_SECRET: "whsec_test" },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: true,
      matchedPaymentReference: "YHP-PAY-TEST",
      verificationStatus: "failed",
      statusMutationApplied: false,
    });
    expect(repository.events[0]).toMatchObject({
      providerCode: "stripe",
      providerEventId: "evt_123",
      paymentReference: "YHP-PAY-TEST",
      verificationStatus: "failed",
      processingStatus: "review_required",
    });
    expect(repository.payments[0].status).toBe("pending");
  });

  test("rejects invalid JSON before persistence", async () => {
    const repository = makePaymentsRepository();
    const response = await handlePaymentWebhookRequest({
      providerCode: "paystack",
      request: new Request("https://example.test/api/payments/webhooks/paystack", {
        method: "POST",
        body: "{not-json",
      }),
      paymentsRepository: repository,
      env: {},
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: "Webhook payload must be valid JSON.",
    });
    expect(repository.events).toEqual([]);
  });
});

interface TestPaymentsRepository extends PaymentsRepository {
  readonly events: PaymentWebhookEventRecord[];
  readonly payments: PaymentRecord[];
}

function makePaymentsRepository(
  options: {
    providers?: PaymentProviderSettingsRecord[];
    payments?: PaymentRecord[];
  } = {},
): TestPaymentsRepository {
  const providers = options.providers ?? [];
  const payments = options.payments ?? [makePaymentRecord()];
  const events: PaymentWebhookEventRecord[] = [];
  return {
    events,
    payments,
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
    async listProviderSettings() {
      return providers;
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
      const event: PaymentWebhookEventRecord = {
        id: `pay_webhook_${events.length + 1}`,
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
      events.push(event);
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

function makeProviderSettings(
  overrides: Partial<PaymentProviderSettingsRecord> = {},
): PaymentProviderSettingsRecord {
  return {
    id: "pay_provider_test",
    providerCode: "pending_configuration",
    displayName: "Pending provider configuration",
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
