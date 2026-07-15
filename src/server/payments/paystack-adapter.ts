import {
  baseProviderReadiness,
  evaluateSecretReference,
  type PaymentProviderAdapter,
} from "./payment-provider-adapter";

export const paystackPaymentAdapter: PaymentProviderAdapter = {
  adapterCode: "paystack_preview",
  providerCode: "paystack",
  displayName: "Paystack",
  capabilities: ["checkout_session", "webhook_verification", "refund_review"],
  evaluate(settings, env) {
    const publicKey = settings.publicKey?.trim() || env.PAYSTACK_PUBLIC_KEY?.trim();
    const secretReference = settings.secretReference?.trim() || "PAYSTACK_SECRET_KEY";
    const missingConfiguration = [
      ...(!publicKey ? ["Paystack public key"] : []),
      ...evaluateSecretReference(secretReference, env),
    ];
    const warnings = [
      "Paystack payment capture is not active. This adapter only checks configuration readiness.",
      ...(settings.currency !== "NGN"
        ? [
            "Paystack is configured most commonly for NGN settlement; confirm currency support before launch.",
          ]
        : []),
      ...(settings.mode === "live"
        ? ["Live mode is saved, but public checkout remains disabled until payment launch."]
        : []),
    ];
    return baseProviderReadiness(this, settings, missingConfiguration, warnings);
  },
};
