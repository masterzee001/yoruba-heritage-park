import { normalisePaymentCurrency } from "../../config/payment-currencies";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../repositories/repository-types";
import { appendCheckoutReturnParams } from "./checkout-return-url";

export interface StripeCredentials {
  readonly publishableKey: string;
  readonly secretKey: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

export interface StripeConfigurationResult {
  readonly ok: boolean;
  readonly credentials?: StripeCredentials;
  readonly missingConfiguration: string[];
}

export interface StripeCheckoutSessionDraft {
  readonly mode: "payment";
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly clientReferenceId: string;
  readonly customerEmail?: string;
  readonly currency: "ngn" | "usd";
  readonly unitAmount: number;
  readonly productName: string;
  readonly metadata: {
    readonly paymentId: string;
    readonly paymentReference: string;
    readonly source: "yoruba_heritage_park";
  };
}

export interface StripeCheckoutSessionResponse {
  readonly id: string;
  readonly object: "checkout.session";
  readonly url?: string | null;
  readonly livemode?: boolean;
}

export interface StripeHttpClient {
  fetch(input: string | URL, init?: RequestInit): Promise<Response>;
}

export class StripeClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeClientError";
  }
}

export function resolveStripeConfiguration(
  settings: PaymentProviderSettingsRecord,
  env: Record<string, string | undefined> = process.env,
): StripeConfigurationResult {
  const config = readStripeConfigurationJson(settings.configurationJson);
  const publishableKey = settings.publicKey?.trim() || env.STRIPE_PUBLISHABLE_KEY?.trim();
  const secretReference = settings.secretReference?.trim() || "STRIPE_SECRET_KEY";
  const secretKey = env[secretReference]?.trim();
  const successUrl =
    config.successUrl?.trim() || env.STRIPE_CHECKOUT_SUCCESS_URL?.trim() || undefined;
  const cancelUrl = config.cancelUrl?.trim() || env.STRIPE_CHECKOUT_CANCEL_URL?.trim() || undefined;
  const missingConfiguration = [
    ...(!publishableKey ? ["Stripe publishable key"] : []),
    ...(!secretKey ? [`${secretReference} environment value`] : []),
    ...(!successUrl ? ["Stripe checkout success URL"] : []),
    ...(!cancelUrl ? ["Stripe checkout cancel URL"] : []),
  ];

  if (
    missingConfiguration.length > 0 ||
    !publishableKey ||
    !secretKey ||
    !successUrl ||
    !cancelUrl
  ) {
    return { ok: false, missingConfiguration };
  }

  return {
    ok: true,
    credentials: { publishableKey, secretKey, successUrl, cancelUrl },
    missingConfiguration: [],
  };
}

export function buildStripeCheckoutSessionDraft(
  payment: PaymentRecord,
  credentials: StripeCredentials,
): StripeCheckoutSessionDraft {
  return {
    mode: "payment",
    successUrl: appendCheckoutReturnParams(credentials.successUrl, {
      status: "success",
      paymentReference: payment.reference,
      providerCode: "stripe",
    }),
    cancelUrl: appendCheckoutReturnParams(credentials.cancelUrl, {
      status: "cancelled",
      paymentReference: payment.reference,
      providerCode: "stripe",
    }),
    clientReferenceId: payment.reference,
    ...(payment.payerEmail ? { customerEmail: payment.payerEmail } : {}),
    currency: normalisePaymentCurrency(payment.currency).toLowerCase() as "ngn" | "usd",
    unitAmount: Math.max(0, Math.trunc(payment.amountMinor)),
    productName: "Yoruba Heritage Park payment request",
    metadata: {
      paymentId: payment.id,
      paymentReference: payment.reference,
      source: "yoruba_heritage_park",
    },
  };
}

export async function createStripeCheckoutSession(
  credentials: StripeCredentials,
  payment: PaymentRecord,
  client: StripeHttpClient = globalThis,
): Promise<StripeCheckoutSessionResponse> {
  const draft = buildStripeCheckoutSessionDraft(payment, credentials);
  const body = new URLSearchParams();
  body.set("mode", draft.mode);
  body.set("success_url", draft.successUrl);
  body.set("cancel_url", draft.cancelUrl);
  body.set("client_reference_id", draft.clientReferenceId);
  if (draft.customerEmail) body.set("customer_email", draft.customerEmail);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", draft.currency);
  body.set("line_items[0][price_data][unit_amount]", String(draft.unitAmount));
  body.set("line_items[0][price_data][product_data][name]", draft.productName);
  body.set("metadata[paymentId]", draft.metadata.paymentId);
  body.set("metadata[paymentReference]", draft.metadata.paymentReference);
  body.set("metadata[source]", draft.metadata.source);

  const response = await client.fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new StripeClientError(
      `Stripe checkout session creation failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as StripeCheckoutSessionResponse;
  if (!payload.id) {
    throw new StripeClientError("Stripe checkout session creation did not return a session ID.");
  }
  return payload;
}

function readStripeConfigurationJson(value: unknown): {
  readonly successUrl?: string;
  readonly cancelUrl?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    successUrl: typeof value.successUrl === "string" ? value.successUrl : undefined,
    cancelUrl: typeof value.cancelUrl === "string" ? value.cancelUrl : undefined,
  };
}
