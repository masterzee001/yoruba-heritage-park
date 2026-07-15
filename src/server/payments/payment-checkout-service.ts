import { getServerEnv } from "../env/server-env";
import type { PaymentsRepository } from "../repositories/payments-repository";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../repositories/repository-types";
import { evaluatePaymentProviderSettings } from "./index";
import {
  initializePaystackTransaction,
  resolvePaystackConfiguration,
  type PaystackHttpClient,
} from "./paystack-client";
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
  readonly paystackClient?: PaystackHttpClient;
}

export type PrepareCheckoutResult =
  | {
      readonly ok: true;
      readonly providerCode: "paypal" | "paystack";
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
  private readonly paystackClient?: PaystackHttpClient;

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    options: PaymentCheckoutServiceOptions = {},
  ) {
    this.env = options.env ?? process.env;
    const serverEnv = getServerEnv({ source: this.env });
    this.paymentEnabled = options.paymentEnabled ?? serverEnv.payments.checkoutEnabled;
    this.allowLiveCapture = options.allowLiveCapture ?? serverEnv.payments.allowLiveCapture;
    this.paypalClient = options.paypalClient;
    this.paystackClient = options.paystackClient;
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
    if (!["paypal", "paystack"].includes(provider.providerCode)) {
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

    if (provider.providerCode === "paystack") {
      return this.preparePaystackCheckout(provider, payment);
    }

    return this.preparePayPalCheckout(provider, payment);
  }

  private async preparePayPalCheckout(
    provider: PaymentProviderSettingsRecord,
    payment: PaymentRecord,
  ): Promise<PrepareCheckoutResult> {
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
        provider: "paypal",
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

  private async preparePaystackCheckout(
    provider: PaymentProviderSettingsRecord,
    payment: PaymentRecord,
  ): Promise<PrepareCheckoutResult> {
    const configuration = resolvePaystackConfiguration(provider, this.env);
    if (!configuration.ok || !configuration.credentials) {
      return {
        ok: false,
        message: "Paystack credentials are incomplete.",
        missingConfiguration: configuration.missingConfiguration,
      };
    }

    const initialized = await initializePaystackTransaction(
      configuration.credentials,
      payment,
      this.paystackClient,
    );
    const providerReference = initialized.data?.reference ?? payment.reference;
    const checkoutUrl = initialized.data?.authorization_url ?? null;

    await this.paymentsRepository.updateCheckoutPreparation(payment.id, {
      providerTransactionReference: providerReference,
      metadataJson: buildCheckoutMetadata(payment, {
        provider: "paystack",
        providerOrderId: providerReference,
        checkoutUrl,
        sandbox: provider.mode !== "live",
      }),
    });

    return {
      ok: true,
      providerCode: "paystack",
      paymentReference: payment.reference,
      providerOrderId: providerReference,
      checkoutUrl,
      sandbox: provider.mode !== "live",
      message:
        provider.mode === "live"
          ? "Paystack checkout transaction prepared."
          : "Paystack test checkout transaction prepared.",
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
    readonly provider: "paypal" | "paystack";
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
      provider: checkout.provider,
      providerOrderId: checkout.providerOrderId,
      checkoutUrl: checkout.checkoutUrl,
      sandbox: checkout.sandbox,
      preparedAt: new Date().toISOString(),
    },
  };
}
