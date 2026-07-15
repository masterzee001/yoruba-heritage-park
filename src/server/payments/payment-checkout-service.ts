import { projectStatus } from "../../config/project-status";
import type { PaymentsRepository } from "../repositories/payments-repository";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../repositories/repository-types";
import { evaluatePaymentProviderSettings } from "./index";
import {
  createPayPalOrder,
  resolvePayPalConfiguration,
  type PayPalHttpClient,
  type PayPalOrderResponse,
} from "./paypal-client";

export interface PrepareCheckoutInput {
  readonly paymentReference: string;
}

export interface PaymentCheckoutServiceOptions {
  readonly paymentEnabled?: boolean;
  readonly allowLiveCapture?: boolean;
  readonly env?: Record<string, string | undefined>;
  readonly paypalClient?: PayPalHttpClient;
}

export type PrepareCheckoutResult =
  | {
      readonly ok: true;
      readonly providerCode: "paypal";
      readonly paymentReference: string;
      readonly providerOrderId: string;
      readonly checkoutUrl: string | null;
      readonly sandbox: boolean;
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly missingConfiguration?: string[];
    };

export class PaymentCheckoutService {
  private readonly paymentEnabled: boolean;
  private readonly allowLiveCapture: boolean;
  private readonly env: Record<string, string | undefined>;
  private readonly paypalClient?: PayPalHttpClient;

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    options: PaymentCheckoutServiceOptions = {},
  ) {
    this.paymentEnabled = options.paymentEnabled ?? projectStatus.paymentEnabled;
    this.allowLiveCapture = options.allowLiveCapture ?? false;
    this.env = options.env ?? process.env;
    this.paypalClient = options.paypalClient;
  }

  async prepare(input: PrepareCheckoutInput): Promise<PrepareCheckoutResult> {
    const reference = input.paymentReference.trim().toUpperCase();
    if (!reference) return { ok: false, message: "Payment reference is required." };

    if (!this.paymentEnabled) {
      return {
        ok: false,
        message: "Online checkout is not active yet. The payment request remains for review.",
      };
    }

    const payment = await this.paymentsRepository.findByReference(reference);
    if (!payment) return { ok: false, message: "Payment request was not found." };
    if (payment.status !== "pending") {
      return { ok: false, message: "Only pending payment requests can start checkout." };
    }

    const provider = await this.findProvider(payment.providerCode);
    if (!provider) return { ok: false, message: "Payment provider is not configured." };
    if (provider.providerCode !== "paypal") {
      return { ok: false, message: "This payment provider does not support checkout yet." };
    }
    if (provider.mode === "live" && !this.allowLiveCapture) {
      return {
        ok: false,
        message: "Live payment capture is not enabled for this environment.",
      };
    }

    const readiness = evaluatePaymentProviderSettings(provider, this.env);
    if (!readiness.integrationReady) {
      return {
        ok: false,
        message: "Payment provider is not ready for checkout.",
        missingConfiguration: readiness.missingConfiguration,
      };
    }

    const configuration = resolvePayPalConfiguration(provider, this.env);
    if (!configuration.ok || !configuration.credentials) {
      return {
        ok: false,
        message: "PayPal credentials are incomplete.",
        missingConfiguration: configuration.missingConfiguration,
      };
    }

    const order = await createPayPalOrder(configuration.credentials, payment, this.paypalClient);
    const checkoutUrl = findApprovalUrl(order);
    await this.paymentsRepository.updateCheckoutPreparation(payment.id, {
      providerTransactionReference: order.id,
      metadataJson: buildCheckoutMetadata(payment, {
        providerOrderId: order.id,
        checkoutUrl,
        sandbox: configuration.credentials.environment === "sandbox",
      }),
    });

    return {
      ok: true,
      providerCode: "paypal",
      paymentReference: payment.reference,
      providerOrderId: order.id,
      checkoutUrl,
      sandbox: configuration.credentials.environment === "sandbox",
      message:
        configuration.credentials.environment === "sandbox"
          ? "PayPal sandbox checkout order prepared."
          : "PayPal checkout order prepared.",
    };
  }

  private async findProvider(providerCode: string): Promise<PaymentProviderSettingsRecord | null> {
    const providers = await this.paymentsRepository.listProviderSettings();
    return providers.find((provider) => provider.providerCode === providerCode) ?? null;
  }
}

function findApprovalUrl(order: PayPalOrderResponse): string | null {
  return order.links?.find((link) => link.rel === "approve")?.href ?? null;
}

function buildCheckoutMetadata(
  payment: PaymentRecord,
  checkout: {
    readonly providerOrderId: string;
    readonly checkoutUrl: string | null;
    readonly sandbox: boolean;
  },
): unknown {
  const existing =
    payment.metadataJson &&
    typeof payment.metadataJson === "object" &&
    !Array.isArray(payment.metadataJson)
      ? payment.metadataJson
      : {};
  return {
    ...existing,
    checkout: {
      provider: "paypal",
      providerOrderId: checkout.providerOrderId,
      checkoutUrl: checkout.checkoutUrl,
      sandbox: checkout.sandbox,
      preparedAt: new Date().toISOString(),
    },
  };
}
