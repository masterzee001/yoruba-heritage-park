import { baseProviderReadiness, type PaymentProviderAdapter } from "./payment-provider-adapter";
import { resolvePayPalConfiguration } from "./paypal-client";

export const paypalPaymentAdapter: PaymentProviderAdapter = {
  adapterCode: "paypal_rest_preview",
  providerCode: "paypal",
  displayName: "PayPal",
  capabilities: ["checkout_session", "webhook_verification", "refund_review"],
  evaluate(settings, env) {
    const configuration = resolvePayPalConfiguration(settings, env);
    const warnings = [
      "PayPal payment capture is not active. This adapter only checks configuration readiness.",
      ...(settings.mode === "live"
        ? ["Live mode is saved, but public checkout remains disabled until payment launch."]
        : []),
    ];
    return baseProviderReadiness(this, settings, configuration.missingConfiguration, warnings);
  },
};
