export type PaymentProviderLaunchCode = "paypal" | "paystack" | "stripe";

export interface PaymentProviderLaunchGuide {
  readonly providerCode: PaymentProviderLaunchCode;
  readonly displayName: string;
  readonly callbackPath: string;
  readonly callbackUrl: string;
  readonly secretReferences: readonly string[];
  readonly status: string;
  readonly notes: string;
}

export const paymentProviderWebhookPaths: Record<PaymentProviderLaunchCode, string> = {
  paypal: "/api/payments/webhooks/paypal",
  paystack: "/api/payments/webhooks/paystack",
  stripe: "/api/payments/webhooks/stripe",
};

const providerGuideMetadata: Record<
  PaymentProviderLaunchCode,
  Omit<PaymentProviderLaunchGuide, "providerCode" | "callbackPath" | "callbackUrl">
> = {
  paypal: {
    displayName: "PayPal",
    secretReferences: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET_KEY", "PAYPAL_WEBHOOK_ID"],
    status: "Ready for test webhook",
    notes:
      "Use the callback URL in PayPal dashboard webhook settings. The server verifies PayPal transmission headers with PAYPAL_WEBHOOK_ID before reconciliation.",
  },
  paystack: {
    displayName: "Paystack",
    secretReferences: ["PAYSTACK_PUBLIC_KEY", "PAYSTACK_SECRET_KEY"],
    status: "Ready for test webhook",
    notes:
      "Use the callback URL in Paystack dashboard webhook settings. The server verifies x-paystack-signature before reconciliation.",
  },
  stripe: {
    displayName: "Stripe",
    secretReferences: ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    status: "Ready for test webhook",
    notes:
      "Use the callback URL as the Stripe endpoint and store its signing secret in STRIPE_WEBHOOK_SECRET. Checkout return URLs stay in provider configuration.",
  },
};

export function getPaymentProviderLaunchGuides(origin?: string): PaymentProviderLaunchGuide[] {
  return (Object.keys(paymentProviderWebhookPaths) as PaymentProviderLaunchCode[]).map(
    (providerCode) => {
      const callbackPath = paymentProviderWebhookPaths[providerCode];
      return {
        providerCode,
        callbackPath,
        callbackUrl: buildPaymentWebhookUrl(providerCode, origin),
        ...providerGuideMetadata[providerCode],
      };
    },
  );
}

export function buildPaymentWebhookUrl(
  providerCode: PaymentProviderLaunchCode,
  origin?: string,
): string {
  const callbackPath = paymentProviderWebhookPaths[providerCode];
  const safeOrigin = normaliseHttpsOrigin(origin);
  return safeOrigin ? `${safeOrigin}${callbackPath}` : callbackPath;
}

export function normalisePaymentReturnUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 300) return undefined;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return undefined;
    if (!parsed.hostname || parsed.username || parsed.password) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function normaliseHttpsOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || !parsed.hostname) return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}
