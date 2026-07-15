import {
  baseProviderReadiness,
  evaluateSecretReference,
  type PaymentProviderAdapter,
} from "./payment-provider-adapter";

export const stripePaymentAdapter: PaymentProviderAdapter = {
  adapterCode: "stripe_checkout_preview",
  providerCode: "stripe",
  displayName: "Stripe",
  capabilities: ["checkout_session", "webhook_verification", "refund_review"],
  evaluate(settings, env) {
    const publishableKey = settings.publicKey?.trim() || env.STRIPE_PUBLISHABLE_KEY?.trim();
    const secretReference = settings.secretReference?.trim() || "STRIPE_SECRET_KEY";
    const missingConfiguration = [
      ...(!publishableKey ? ["Stripe publishable key"] : []),
      ...evaluateSecretReference(secretReference, env),
    ];
    const warnings = [
      "Stripe payment capture is not active. This adapter only checks configuration readiness.",
      ...(settings.mode === "live"
        ? ["Live mode is saved, but public checkout remains disabled until payment launch."]
        : []),
    ];
    return baseProviderReadiness(this, settings, missingConfiguration, warnings);
  },
};
