import { getPaymentProviderLaunchGuides } from "../src/config/payment-provider-launch";
import { getServerEnv, ServerEnvError } from "../src/server/env/server-env";

type ProviderCode = "paypal" | "paystack" | "stripe";
type CheckLevel = "pass" | "warn" | "fail";

interface CheckResult {
  readonly level: CheckLevel;
  readonly label: string;
  readonly detail: string;
}

interface ProviderRequirement {
  readonly providerCode: ProviderCode;
  readonly displayName: string;
  readonly requiredEnv: readonly string[];
  readonly optionalEnv: readonly string[];
  readonly checkoutUrlEnv: readonly string[];
}

const providerRequirements: readonly ProviderRequirement[] = [
  {
    providerCode: "paypal",
    displayName: "PayPal",
    requiredEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET_KEY"],
    optionalEnv: ["PAYPAL_WEBHOOK_ID"],
    checkoutUrlEnv: ["PAYPAL_CHECKOUT_SUCCESS_URL", "PAYPAL_CHECKOUT_CANCEL_URL"],
  },
  {
    providerCode: "paystack",
    displayName: "Paystack",
    requiredEnv: ["PAYSTACK_PUBLIC_KEY", "PAYSTACK_SECRET_KEY"],
    optionalEnv: [],
    checkoutUrlEnv: ["PAYSTACK_CHECKOUT_CALLBACK_URL"],
  },
  {
    providerCode: "stripe",
    displayName: "Stripe",
    requiredEnv: ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"],
    optionalEnv: ["STRIPE_WEBHOOK_SECRET"],
    checkoutUrlEnv: ["STRIPE_CHECKOUT_SUCCESS_URL", "STRIPE_CHECKOUT_CANCEL_URL"],
  },
];

const allowLiveCaptureFlag = process.argv.includes("--allow-live-capture");
const publicBaseUrl = process.env.PAYMENT_PUBLIC_BASE_URL?.trim();
const checks: CheckResult[] = [];

try {
  const serverEnv = getServerEnv();
  checks.push({
    level: "pass",
    label: "Server environment",
    detail: "Server-only environment validation passed.",
  });

  checks.push({
    level: serverEnv.payments.checkoutEnabled ? "pass" : "warn",
    label: "Checkout launch flag",
    detail: serverEnv.payments.checkoutEnabled
      ? "PAYMENT_CHECKOUT_ENABLED is enabled for checkout testing."
      : "PAYMENT_CHECKOUT_ENABLED is disabled; provider checkout links will not be created.",
  });

  if (serverEnv.payments.allowLiveCapture && !allowLiveCaptureFlag) {
    checks.push({
      level: "fail",
      label: "Live capture guard",
      detail:
        "PAYMENT_ALLOW_LIVE_CAPTURE is true. Re-run with --allow-live-capture only when this is intentional.",
    });
  } else {
    checks.push({
      level: serverEnv.payments.allowLiveCapture ? "warn" : "pass",
      label: "Live capture guard",
      detail: serverEnv.payments.allowLiveCapture
        ? "Live capture is explicitly allowed for this run."
        : "Live capture is locked.",
    });
  }

  if (serverEnv.payments.paypal.environment === "live" && !allowLiveCaptureFlag) {
    checks.push({
      level: "fail",
      label: "PayPal environment",
      detail:
        "PAYPAL_ENVIRONMENT is live. Re-run with --allow-live-capture only when live testing is intentional.",
    });
  } else {
    checks.push({
      level: serverEnv.payments.paypal.environment === "live" ? "warn" : "pass",
      label: "PayPal environment",
      detail: `PAYPAL_ENVIRONMENT resolves to ${serverEnv.payments.paypal.environment}.`,
    });
  }
} catch (error) {
  if (error instanceof ServerEnvError) {
    checks.push({
      level: "fail",
      label: "Server environment",
      detail: [
        error.message,
        error.missingVariables.length
          ? `Missing: ${error.missingVariables.join(", ")}.`
          : undefined,
        error.invalidVariables.length
          ? `Invalid: ${error.invalidVariables.join(", ")}.`
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    });
  } else {
    checks.push({
      level: "fail",
      label: "Server environment",
      detail: error instanceof Error ? error.message : "Unknown environment validation error.",
    });
  }
}

for (const provider of providerRequirements) {
  const missingRequired = provider.requiredEnv.filter((name) => !hasEnvValue(name));
  const missingOptional = provider.optionalEnv.filter((name) => !hasEnvValue(name));
  checks.push({
    level: missingRequired.length ? "warn" : "pass",
    label: `${provider.displayName} required configuration`,
    detail: missingRequired.length
      ? `Missing for sandbox checkout: ${missingRequired.join(", ")}.`
      : "Required sandbox key references are present.",
  });

  if (missingOptional.length) {
    checks.push({
      level: "warn",
      label: `${provider.displayName} webhook configuration`,
      detail: `Optional but recommended for webhook verification: ${missingOptional.join(", ")}.`,
    });
  } else if (provider.optionalEnv.length) {
    checks.push({
      level: "pass",
      label: `${provider.displayName} webhook configuration`,
      detail: "Webhook verification reference is present.",
    });
  }

  for (const envName of provider.checkoutUrlEnv) {
    const value = process.env[envName]?.trim();
    if (!value) {
      checks.push({
        level: "warn",
        label: `${provider.displayName} ${envName}`,
        detail: "Not set. Provider configuration may still provide a per-provider return URL.",
      });
      continue;
    }

    checks.push({
      level: isSafeCheckoutUrl(value) ? "pass" : "fail",
      label: `${provider.displayName} ${envName}`,
      detail: isSafeCheckoutUrl(value)
        ? "Return URL is an internal path or HTTPS URL."
        : "Return URL must be an internal path or HTTPS URL.",
    });
  }
}

const webhookGuides = getPaymentProviderLaunchGuides(publicBaseUrl);
for (const guide of webhookGuides) {
  checks.push({
    level: guide.callbackUrl.startsWith("https://") ? "pass" : "warn",
    label: `${guide.displayName} webhook callback`,
    detail: guide.callbackUrl.startsWith("https://")
      ? `${guide.callbackUrl} is ready for provider dashboard setup.`
      : `Set PAYMENT_PUBLIC_BASE_URL to show the absolute callback for ${guide.callbackPath}.`,
  });
}

printResults(checks);
if (checks.some((check) => check.level === "fail")) {
  process.exitCode = 1;
}

function hasEnvValue(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function isSafeCheckoutUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function printResults(results: readonly CheckResult[]): void {
  console.log("Payment sandbox QA readiness");
  console.log("============================");
  for (const result of results) {
    const marker = result.level === "pass" ? "PASS" : result.level === "warn" ? "WARN" : "FAIL";
    console.log(`[${marker}] ${result.label}: ${result.detail}`);
  }

  const summary = results.reduce(
    (count, result) => {
      count[result.level] += 1;
      return count;
    },
    { pass: 0, warn: 0, fail: 0 } as Record<CheckLevel, number>,
  );
  console.log(
    `Summary: ${summary.pass} passed, ${summary.warn} warnings, ${summary.fail} failures.`,
  );
}
