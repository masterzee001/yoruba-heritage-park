import type { PaymentRecord, PaymentWebhookEventRecord } from "../repositories/repository-types";

export interface ApplyWebhookPaymentSuccessInput {
  readonly eventId: string;
  readonly paymentId: string;
  readonly appliedByUserId: string;
}

export interface ApplyWebhookPaymentSuccessResult {
  readonly payment: PaymentRecord;
  readonly event: PaymentWebhookEventRecord;
  readonly bookingPaymentStateApplied: boolean;
}

export interface PaymentReconciliationRepository {
  findByReference(reference: string): Promise<PaymentRecord | null>;
  findWebhookEventById(id: string): Promise<PaymentWebhookEventRecord | null>;
  applyWebhookPaymentSuccess(
    input: ApplyWebhookPaymentSuccessInput,
  ): Promise<ApplyWebhookPaymentSuccessResult>;
}

export type ReconcileVerifiedWebhookResult =
  | {
      readonly ok: true;
      readonly payment: PaymentRecord;
      readonly event: PaymentWebhookEventRecord;
      readonly bookingPaymentStateApplied: boolean;
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export class PaymentReconciliationService {
  constructor(private readonly repository: PaymentReconciliationRepository) {}

  async applyVerifiedWebhookEvent(
    eventId: string,
    appliedByUserId: string,
  ): Promise<ReconcileVerifiedWebhookResult> {
    const cleanEventId = eventId.trim();
    if (!cleanEventId) return { ok: false, message: "Webhook event id is required." };

    const event = await this.repository.findWebhookEventById(cleanEventId);
    if (!event) return { ok: false, message: "Webhook event was not found." };
    if (event.verificationStatus !== "verified") {
      return { ok: false, message: "Only verified webhook events can be applied." };
    }
    if (event.processingStatus === "processed") {
      return { ok: false, message: "This webhook event has already been processed." };
    }
    if (!event.paymentReference) {
      return { ok: false, message: "Webhook event is not matched to a local payment." };
    }

    const payment = await this.repository.findByReference(event.paymentReference);
    if (!payment) return { ok: false, message: "Matched payment record was not found." };
    if (payment.status !== "pending") {
      return { ok: false, message: "Only pending payment records can be reconciled." };
    }

    const result = await this.repository.applyWebhookPaymentSuccess({
      eventId: event.id,
      paymentId: payment.id,
      appliedByUserId,
    });

    return {
      ok: true,
      payment: result.payment,
      event: result.event,
      bookingPaymentStateApplied: result.bookingPaymentStateApplied,
      message: result.bookingPaymentStateApplied
        ? "Verified webhook applied. Payment marked successful and linked booking marked paid."
        : "Verified webhook applied. Payment marked successful.",
    };
  }
}
