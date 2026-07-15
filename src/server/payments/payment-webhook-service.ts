import type { PaymentsRepository } from "../repositories/payments-repository";
import type { PaymentRecord, PaymentWebhookEventRecord } from "../repositories/repository-types";
import type { WebhookSignatureVerificationResult } from "./webhook-signatures";

export interface RecordPaymentWebhookInput {
  readonly providerCode: string;
  readonly payload: unknown;
  readonly signatureVerification?: WebhookSignatureVerificationResult;
}

export type RecordPaymentWebhookResult =
  | {
      readonly ok: true;
      readonly event: PaymentWebhookEventRecord;
      readonly matchedPayment: PaymentRecord | null;
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export class PaymentWebhookService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async record(input: RecordPaymentWebhookInput): Promise<RecordPaymentWebhookResult> {
    const providerCode = input.providerCode.trim().toLowerCase();
    if (!providerCode) return { ok: false, message: "Payment provider is required." };
    if (!["paypal", "paystack", "stripe"].includes(providerCode)) {
      return { ok: false, message: "Webhook intake is not configured for this provider." };
    }

    const payload = asRecord(input.payload);
    if (!payload) return { ok: false, message: "Webhook payload must be an object." };

    const eventIdentity = readEventIdentity(providerCode, payload);
    if (!eventIdentity) {
      return {
        ok: false,
        message: `Webhook payload is missing ${formatProviderName(providerCode)} event identity.`,
      };
    }

    const paymentMatch = await this.findMatchedPayment(providerCode, payload);
    const verificationStatus = mapVerificationStatus(input.signatureVerification);
    const event = await this.paymentsRepository.recordWebhookEvent({
      providerCode,
      providerEventId: eventIdentity.providerEventId,
      eventType: eventIdentity.eventType,
      paymentId: paymentMatch.payment?.id ?? null,
      paymentReference: paymentMatch.payment?.reference ?? paymentMatch.reference,
      processingStatus: paymentMatch.payment ? "review_required" : "received",
      verificationStatus,
      payloadJson: {
        ...payload,
        yhpProcessing: {
          matchedPaymentReference: paymentMatch.payment?.reference ?? paymentMatch.reference,
          matchedBy: paymentMatch.matchedBy,
          signatureVerification: input.signatureVerification ?? null,
          statusMutationApplied: false,
        },
      },
    });

    return {
      ok: true,
      event,
      matchedPayment: paymentMatch.payment,
      message: paymentMatch.payment
        ? "Payment webhook recorded for review. Payment status was not changed."
        : "Payment webhook recorded. No local payment match was found.",
    };
  }

  private async findMatchedPayment(
    providerCode: string,
    payload: Record<string, unknown>,
  ): Promise<{
    readonly payment: PaymentRecord | null;
    readonly reference: string | null;
    readonly matchedBy: "provider_transaction_reference" | "payment_reference" | "none";
  }> {
    const providerTransactionReference = extractProviderTransactionReference(providerCode, payload);
    if (providerTransactionReference) {
      const payment = await this.paymentsRepository.findByProviderTransactionReference(
        providerCode,
        providerTransactionReference,
      );
      if (payment) {
        return {
          payment,
          reference: payment.reference,
          matchedBy: "provider_transaction_reference",
        };
      }
    }

    const reference = extractPaymentReference(providerCode, payload);
    if (reference) {
      const payment = await this.paymentsRepository.findByReference(reference);
      return { payment, reference, matchedBy: payment ? "payment_reference" : "none" };
    }

    return { payment: null, reference: null, matchedBy: "none" };
  }
}

function readEventIdentity(
  providerCode: string,
  payload: Record<string, unknown>,
): { providerEventId: string; eventType: string } | null {
  if (providerCode === "paystack") {
    const eventType = readString(payload.event);
    const data = asRecord(payload.data);
    const providerEventId = readString(data?.id) ?? readString(data?.reference);
    return providerEventId && eventType ? { providerEventId, eventType } : null;
  }

  const providerEventId = readString(payload.id);
  const eventType = readString(providerCode === "stripe" ? payload.type : payload.event_type);
  return providerEventId && eventType ? { providerEventId, eventType } : null;
}

function extractProviderTransactionReference(
  providerCode: string,
  payload: Record<string, unknown>,
): string | null {
  if (providerCode === "paypal") return readString(asRecord(payload.resource)?.id);
  if (providerCode === "paystack") return readString(asRecord(payload.data)?.reference);
  if (providerCode === "stripe") {
    const object = asRecord(asRecord(payload.data)?.object);
    return readString(object?.id);
  }
  return null;
}

function extractPaymentReference(
  providerCode: string,
  payload: Record<string, unknown>,
): string | null {
  if (providerCode === "paystack") {
    const data = asRecord(payload.data);
    const metadata = asRecord(data?.metadata);
    return (
      readString(metadata?.paymentReference)?.toUpperCase() ??
      readString(metadata?.payment_reference)?.toUpperCase() ??
      null
    );
  }

  if (providerCode === "stripe") {
    const object = asRecord(asRecord(payload.data)?.object);
    return (
      readString(object?.client_reference_id)?.toUpperCase() ??
      readString(asRecord(object?.metadata)?.paymentReference)?.toUpperCase() ??
      null
    );
  }

  const resource = asRecord(payload.resource);
  if (!resource) return null;
  const purchaseUnits = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
  for (const unit of purchaseUnits) {
    const record = asRecord(unit);
    const reference = readString(record?.reference_id);
    if (reference) return reference.toUpperCase();
  }
  return null;
}

function mapVerificationStatus(
  verification: WebhookSignatureVerificationResult | undefined,
): PaymentWebhookEventRecord["verificationStatus"] {
  if (!verification) return "unverified";
  return verification.ok ? "verified" : "failed";
}

function formatProviderName(providerCode: string): string {
  if (providerCode === "paypal") return "PayPal";
  if (providerCode === "paystack") return "Paystack";
  if (providerCode === "stripe") return "Stripe";
  return providerCode;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}
