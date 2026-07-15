import type { PaymentProviderSettingsRecord } from "../repositories/repository-types";
import { paypalPaymentAdapter } from "./paypal-adapter";
import { pendingPaymentAdapter } from "./pending-adapter";
import type { PaymentProviderAdapter, PaymentProviderReadiness } from "./payment-provider-adapter";

export type { PaymentProviderAdapter, PaymentProviderReadiness } from "./payment-provider-adapter";
export { PaymentRequestService, createPaymentReference } from "./payment-request-service";
export type {
  PreparePaymentRequestInput,
  PreparePaymentRequestResult,
} from "./payment-request-service";
export { PaymentCheckoutService } from "./payment-checkout-service";
export type {
  PaymentCheckoutServiceOptions,
  PrepareCheckoutInput,
  PrepareCheckoutResult,
} from "./payment-checkout-service";
export { PaymentWebhookService } from "./payment-webhook-service";
export type {
  RecordPaymentWebhookInput,
  RecordPaymentWebhookResult,
} from "./payment-webhook-service";
export {
  buildPayPalOrderDraft,
  createPayPalOrder,
  requestPayPalAccessToken,
  resolvePayPalBaseUrl,
  resolvePayPalConfiguration,
} from "./paypal-client";
export type {
  PayPalConfigurationResult,
  PayPalCredentials,
  PayPalEnvironment,
  PayPalOrderDraft,
  PayPalOrderResponse,
} from "./paypal-client";

const adapters = new Map<string, PaymentProviderAdapter>(
  [pendingPaymentAdapter, paypalPaymentAdapter].map((adapter) => [adapter.providerCode, adapter]),
);

export function getPaymentProviderAdapter(providerCode: string): PaymentProviderAdapter | null {
  return adapters.get(providerCode.toLowerCase()) ?? null;
}

export function listSupportedPaymentProviderCodes(): string[] {
  return [...adapters.keys()].sort();
}

export function evaluatePaymentProviderSettings(
  settings: PaymentProviderSettingsRecord,
  env: Record<string, string | undefined> = process.env,
): PaymentProviderReadiness {
  const adapter = getPaymentProviderAdapter(settings.providerCode);
  if (!adapter) {
    return {
      providerCode: settings.providerCode,
      displayName: settings.displayName,
      adapterCode: "unsupported",
      supported: false,
      enabled: settings.enabled,
      mode: settings.mode,
      currency: settings.currency,
      integrationReady: false,
      liveCaptureEnabled: false,
      capabilities: [],
      missingConfiguration: ["Supported provider adapter"],
      warnings: [
        "Provider settings are saved, but no server-side adapter exists for this provider code.",
      ],
    };
  }
  return adapter.evaluate(settings, env);
}
