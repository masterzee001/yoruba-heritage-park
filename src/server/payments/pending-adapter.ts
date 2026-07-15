import type { PaymentProviderAdapter } from "./payment-provider-adapter";

export const pendingPaymentAdapter: PaymentProviderAdapter = {
  adapterCode: "pending_configuration",
  providerCode: "pending_configuration",
  displayName: "Pending provider configuration",
  capabilities: [],
  evaluate(settings) {
    return {
      providerCode: settings.providerCode,
      displayName: settings.displayName || this.displayName,
      adapterCode: this.adapterCode,
      supported: true,
      enabled: settings.enabled,
      mode: settings.mode,
      currency: settings.currency,
      integrationReady: false,
      liveCaptureEnabled: false,
      capabilities: [],
      missingConfiguration: ["Approved payment provider"],
      warnings: [
        "Select and configure a payment provider before payment collection is considered.",
      ],
    };
  },
};
