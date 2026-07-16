import type {
  PaymentProviderLaunchCode,
  PaymentProviderLaunchGuide,
} from "./payment-provider-launch";

export type PaymentLaunchChecklistState = "ready" | "pending" | "blocked";

export interface PaymentLaunchChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly state: PaymentLaunchChecklistState;
  readonly detail: string;
}

export interface PaymentLaunchChecklistProvider {
  readonly providerCode: string;
  readonly integrationReady: boolean;
  readonly missingConfiguration: readonly string[];
}

export interface PaymentLaunchChecklistStatus {
  readonly checkoutEnabled: boolean;
  readonly allowLiveCapture: boolean;
  readonly paypalEnvironment: "sandbox" | "live";
}

const requiredProviderCodes: readonly PaymentProviderLaunchCode[] = [
  "paypal",
  "paystack",
  "stripe",
];

export function buildPaymentLaunchChecklist(input: {
  readonly launchStatus: PaymentLaunchChecklistStatus | null;
  readonly providerReadiness: readonly PaymentLaunchChecklistProvider[] | null;
  readonly webhookGuides: readonly PaymentProviderLaunchGuide[];
  readonly adminOrigin?: string;
}): PaymentLaunchChecklistItem[] {
  const configuredProviders =
    input.providerReadiness?.filter((provider) =>
      requiredProviderCodes.includes(provider.providerCode as PaymentProviderLaunchCode),
    ) ?? [];
  const missingProviders = requiredProviderCodes.filter(
    (code) =>
      !configuredProviders.some(
        (provider) => provider.providerCode === code && provider.integrationReady,
      ),
  );
  const callbacksAreAbsolute = input.webhookGuides.every((guide) =>
    guide.callbackUrl.startsWith("https://"),
  );
  const finalDomainReady = Boolean(
    input.adminOrigin &&
    input.adminOrigin.startsWith("https://") &&
    !input.adminOrigin.includes("yhp-preview.") &&
    !input.adminOrigin.includes("localhost"),
  );

  return [
    {
      id: "final-domain",
      label: "Final domain",
      state: finalDomainReady ? "ready" : "pending",
      detail: finalDomainReady
        ? "Production callback and return URLs can use the current domain."
        : "Use the confirmed production domain before live provider setup.",
    },
    {
      id: "checkout-flag",
      label: "Checkout flag",
      state: input.launchStatus?.checkoutEnabled ? "ready" : "pending",
      detail: input.launchStatus?.checkoutEnabled
        ? "Checkout links can be prepared in this environment."
        : "PAYMENT_CHECKOUT_ENABLED must stay off until sandbox credentials are ready.",
    },
    {
      id: "live-capture",
      label: "Live capture guard",
      state: input.launchStatus?.allowLiveCapture ? "blocked" : "ready",
      detail: input.launchStatus?.allowLiveCapture
        ? "Live capture is enabled. Confirm this is intentional before testing."
        : "Live capture is locked while sandbox setup continues.",
    },
    {
      id: "paypal-mode",
      label: "PayPal mode",
      state: input.launchStatus?.paypalEnvironment === "live" ? "blocked" : "ready",
      detail:
        input.launchStatus?.paypalEnvironment === "live"
          ? "PayPal is in live mode. Keep sandbox mode until launch approval."
          : "PayPal resolves to sandbox mode.",
    },
    {
      id: "provider-readiness",
      label: "Provider readiness",
      state: missingProviders.length ? "pending" : "ready",
      detail: missingProviders.length
        ? `Waiting on configuration for ${missingProviders.join(", ")}.`
        : "PayPal, Paystack and Stripe are ready for checkout testing.",
    },
    {
      id: "webhook-callbacks",
      label: "Webhook callbacks",
      state: callbacksAreAbsolute ? "ready" : "pending",
      detail: callbacksAreAbsolute
        ? "Provider callback URLs are absolute HTTPS URLs."
        : "Open admin from a secure domain or set the public base URL before copying callbacks.",
    },
    {
      id: "manual-reconciliation",
      label: "Manual reconciliation",
      state: "ready",
      detail:
        "Verified matched webhook events require administrator review before applying status changes.",
    },
  ];
}
