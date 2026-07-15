import { randomUUID } from "node:crypto";

import { projectStatus } from "../../config/project-status";
import type { PaymentsRepository } from "../repositories/payments-repository";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../repositories/repository-types";
import { evaluatePaymentProviderSettings } from "./index";

export interface PreparePaymentRequestInput {
  readonly bookingId?: string | null;
  readonly campaignId?: string | null;
  readonly payerName: string;
  readonly payerEmail?: string | null;
  readonly amountMinor: number;
  readonly currency?: string;
  readonly providerCode: string;
}

export type PreparePaymentRequestResult =
  | {
      readonly ok: true;
      readonly payment: PaymentRecord;
      readonly checkoutAvailable: false;
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly missingConfiguration?: string[];
    };

export class PaymentRequestService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly env: Record<string, string | undefined> = process.env,
  ) {}

  async prepare(input: PreparePaymentRequestInput): Promise<PreparePaymentRequestResult> {
    const targetCount = Number(Boolean(input.bookingId)) + Number(Boolean(input.campaignId));
    if (targetCount !== 1) {
      return { ok: false, message: "Payment request must reference one booking or one campaign." };
    }
    if (!input.payerName.trim()) return { ok: false, message: "Payer name is required." };
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      return { ok: false, message: "Payment amount must be greater than zero." };
    }

    const currency = (input.currency ?? "NGN").trim().toUpperCase();
    if (currency !== "NGN")
      return { ok: false, message: "Only NGN payment requests are supported." };

    const providerCode = input.providerCode.trim().toLowerCase();
    const provider = await this.findProvider(providerCode);
    if (!provider) return { ok: false, message: "Payment provider is not configured." };

    const readiness = evaluatePaymentProviderSettings(provider, this.env);
    if (!readiness.supported) {
      return {
        ok: false,
        message: "Payment provider is saved but has no supported adapter.",
        missingConfiguration: readiness.missingConfiguration,
      };
    }
    if (!readiness.enabled || !readiness.integrationReady) {
      return {
        ok: false,
        message: "Payment provider is not ready for payment requests.",
        missingConfiguration: readiness.missingConfiguration,
      };
    }

    const payment = await this.paymentsRepository.create({
      reference: createPaymentReference(),
      bookingId: input.bookingId ?? null,
      campaignId: input.campaignId ?? null,
      payerName: input.payerName,
      payerEmail: input.payerEmail,
      amountMinor: input.amountMinor,
      currency,
      providerCode,
      status: "pending",
      verificationStatus: "unverified",
      refundStatus: "none",
      metadataJson: {
        source: "payment_request_service",
        adapterCode: readiness.adapterCode,
        checkoutAvailable: false,
        paymentCaptureEnabled: projectStatus.paymentEnabled && readiness.liveCaptureEnabled,
        liveCaptureEnabled: readiness.liveCaptureEnabled,
      },
    });

    return {
      ok: true,
      payment,
      checkoutAvailable: false,
      message:
        "Payment request prepared for administrator review. Checkout remains inactive until live provider activation.",
    };
  }

  private async findProvider(providerCode: string): Promise<PaymentProviderSettingsRecord | null> {
    const providers = await this.paymentsRepository.listProviderSettings();
    return providers.find((provider) => provider.providerCode === providerCode) ?? null;
  }
}

export function createPaymentReference(): string {
  return `YHP-PAY-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}
