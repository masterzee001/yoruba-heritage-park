import type { PaymentsRepository } from "../repositories/payments-repository";
import type { PaymentProviderSettingsRecord } from "../repositories/repository-types";
import { PaymentWebhookService } from "./payment-webhook-service";
import type { PayPalHttpClient } from "./paypal-client";
import {
  verifyPayPalWebhookSignature,
  verifyPaystackWebhookSignature,
  verifyStripeWebhookSignature,
} from "./webhook-signatures";

export type PaymentWebhookEndpointProvider = "paypal" | "paystack" | "stripe";

export interface HandlePaymentWebhookRequestOptions {
  readonly providerCode: PaymentWebhookEndpointProvider;
  readonly request: Request;
  readonly paymentsRepository: PaymentsRepository;
  readonly env?: Record<string, string | undefined>;
  readonly paypalClient?: PayPalHttpClient;
}

export async function handlePaymentWebhookRequest({
  providerCode,
  request,
  paymentsRepository,
  env = process.env,
  paypalClient,
}: HandlePaymentWebhookRequestOptions): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ ok: false, message: "Method not allowed." }, { status: 405 });
  }

  const rawBody = await request.text();
  const payload = parseJsonPayload(rawBody);
  if (!payload.ok) {
    return Response.json({ ok: false, message: payload.message }, { status: 400 });
  }

  const providerSettings = await findProviderSettings(paymentsRepository, providerCode);
  const signatureVerification = await verifyWebhookSignature({
    providerCode,
    request,
    rawBody,
    payload: payload.value,
    providerSettings,
    env,
    paypalClient,
  });

  const result = await new PaymentWebhookService(paymentsRepository).record({
    providerCode,
    payload: payload.value,
    signatureVerification,
  });

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        message: result.message,
        signatureVerification,
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      ok: true,
      message: result.message,
      eventId: result.event.id,
      matchedPaymentReference: result.matchedPayment?.reference ?? null,
      verificationStatus: result.event.verificationStatus,
      statusMutationApplied: false,
    },
    { status: signatureVerification.ok ? 202 : 400 },
  );
}

async function verifyWebhookSignature({
  providerCode,
  request,
  rawBody,
  payload,
  providerSettings,
  env,
  paypalClient,
}: {
  readonly providerCode: PaymentWebhookEndpointProvider;
  readonly request: Request;
  readonly rawBody: string;
  readonly payload: unknown;
  readonly providerSettings: PaymentProviderSettingsRecord | null;
  readonly env: Record<string, string | undefined>;
  readonly paypalClient?: PayPalHttpClient;
}) {
  if (providerCode === "paypal") {
    const configuration = resolvePayPalWebhookConfiguration(providerSettings, env);
    return verifyPayPalWebhookSignature({
      payload,
      headers: request.headers,
      webhookId: configuration.webhookId,
      credentials: configuration.credentials,
      client: paypalClient,
    });
  }

  if (providerCode === "paystack") {
    return verifyPaystackWebhookSignature({
      rawBody,
      signature: request.headers.get("x-paystack-signature"),
      secretKey: resolvePaystackWebhookSecret(providerSettings, env),
    });
  }

  return verifyStripeWebhookSignature({
    rawBody,
    signatureHeader: request.headers.get("stripe-signature"),
    endpointSecret: resolveStripeWebhookSecret(providerSettings, env),
  });
}

function parseJsonPayload(rawBody: string):
  | {
      readonly ok: true;
      readonly value: unknown;
    }
  | {
      readonly ok: false;
      readonly message: string;
    } {
  try {
    return { ok: true, value: JSON.parse(rawBody) as unknown };
  } catch {
    return { ok: false, message: "Webhook payload must be valid JSON." };
  }
}

async function findProviderSettings(
  paymentsRepository: PaymentsRepository,
  providerCode: PaymentWebhookEndpointProvider,
): Promise<PaymentProviderSettingsRecord | null> {
  const providers = await paymentsRepository.listProviderSettings();
  return providers.find((provider) => provider.providerCode === providerCode) ?? null;
}

function resolvePaystackWebhookSecret(
  providerSettings: PaymentProviderSettingsRecord | null,
  env: Record<string, string | undefined>,
): string | undefined {
  const secretReference = providerSettings?.secretReference?.trim() || "PAYSTACK_SECRET_KEY";
  return env[secretReference]?.trim();
}

function resolveStripeWebhookSecret(
  providerSettings: PaymentProviderSettingsRecord | null,
  env: Record<string, string | undefined>,
): string | undefined {
  const config = readWebhookConfiguration(providerSettings?.configurationJson);
  const secretReference = config.webhookSecretReference || "STRIPE_WEBHOOK_SECRET";
  return env[secretReference]?.trim();
}

function resolvePayPalWebhookConfiguration(
  providerSettings: PaymentProviderSettingsRecord | null,
  env: Record<string, string | undefined>,
) {
  const config = readWebhookConfiguration(providerSettings?.configurationJson);
  const secretReference = providerSettings?.secretReference?.trim() || "PAYPAL_SECRET_KEY";
  const clientId = providerSettings?.publicKey?.trim() || env.PAYPAL_CLIENT_ID?.trim();
  const secretKey = env[secretReference]?.trim();
  const environment =
    env.PAYPAL_ENVIRONMENT === "live" || providerSettings?.mode === "live" ? "live" : "sandbox";
  const webhookIdReference = config.webhookIdReference || "PAYPAL_WEBHOOK_ID";
  const webhookId = config.webhookId || env[webhookIdReference]?.trim();

  return {
    webhookId,
    credentials:
      clientId && secretKey
        ? {
            environment,
            clientId,
            secretKey,
          }
        : null,
  };
}

function readWebhookConfiguration(value: unknown): {
  readonly webhookSecretReference?: string;
  readonly webhookIdReference?: string;
  readonly webhookId?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as {
    webhookSecretReference?: unknown;
    webhookIdReference?: unknown;
    webhookId?: unknown;
  };
  return {
    webhookSecretReference:
      typeof record.webhookSecretReference === "string"
        ? record.webhookSecretReference.trim() || undefined
        : undefined,
    webhookIdReference:
      typeof record.webhookIdReference === "string"
        ? record.webhookIdReference.trim() || undefined
        : undefined,
    webhookId:
      typeof record.webhookId === "string" ? record.webhookId.trim() || undefined : undefined,
  };
}
