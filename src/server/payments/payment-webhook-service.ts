import type { PaymentsRepository } from "../repositories/payments-repository";
import type { PaymentRecord, PaymentWebhookEventRecord } from "../repositories/repository-types";

export interface RecordPaymentWebhookInput {
  readonly providerCode: string;
  readonly payload: unknown;
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
    if (providerCode !== "paypal") {
      return { ok: false, message: "Webhook intake is not configured for this provider." };
    }

    const payload = asRecord(input.payload);
    if (!payload) return { ok: false, message: "Webhook payload must be an object." };

    const providerEventId = readString(payload.id);
    const eventType = readString(payload.event_type);
    if (!providerEventId || !eventType) {
      return { ok: false, message: "Webhook payload is missing PayPal event identity." };
    }

    const paymentMatch = await this.findMatchedPayment(payload);
    const event = await this.paymentsRepository.recordWebhookEvent({
      providerCode,
      providerEventId,
      eventType,
      paymentId: paymentMatch.payment?.id ?? null,
      paymentReference: paymentMatch.payment?.reference ?? paymentMatch.reference,
      processingStatus: paymentMatch.payment ? "review_required" : "received",
      verificationStatus: "unverified",
      payloadJson: {
        ...payload,
        yhpProcessing: {
          matchedPaymentReference: paymentMatch.payment?.reference ?? paymentMatch.reference,
          matchedBy: paymentMatch.matchedBy,
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

  private async findMatchedPayment(payload: Record<string, unknown>): Promise<{
    readonly payment: PaymentRecord | null;
    readonly reference: string | null;
    readonly matchedBy: "provider_transaction_reference" | "payment_reference" | "none";
  }> {
    const resource = asRecord(payload.resource);
    const providerTransactionReference = readString(resource?.id);
    if (providerTransactionReference) {
      const payment = await this.paymentsRepository.findByProviderTransactionReference(
        "paypal",
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

    const reference = extractPaymentReference(resource);
    if (reference) {
      const payment = await this.paymentsRepository.findByReference(reference);
      return { payment, reference, matchedBy: payment ? "payment_reference" : "none" };
    }

    return { payment: null, reference: null, matchedBy: "none" };
  }
}

function extractPaymentReference(resource: Record<string, unknown> | null): string | null {
  if (!resource) return null;
  const purchaseUnits = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
  for (const unit of purchaseUnits) {
    const record = asRecord(unit);
    const reference = readString(record?.reference_id);
    if (reference) return reference.toUpperCase();
  }
  return null;
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
