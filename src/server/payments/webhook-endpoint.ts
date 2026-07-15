import type { PaymentsRepository } from "../repositories/payments-repository";
import type { PaymentProviderSettingsRecord } from "../repositories/repository-types";
import { PaymentWebhookService } from "./payment-webhook-service";
import { verifyPaystackWebhookSignature, verifyStripeWebhookSignature } from "./webhook-signatures";

export type PaymentWebhookEndpointProvider = "paystack" | "stripe";

export interface HandlePaymentWebhookRequestOptions {
  readonly providerCode: PaymentWebhookEndpointProvider;
  readonly request: Request;
  readonly paymentsRepository: PaymentsRepository;
  readonly env?: Record<string, string | undefined>;
}

export async function handlePaymentWebhookRequest({
  providerCode,
  request,
  paymentsRepository,
  env = process.env,
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
  const signatureVerification =
    providerCode === "paystack"
      ? verifyPaystackWebhookSignature({
          rawBody,
          signature: request.headers.get("x-paystack-signature"),
          secretKey: resolvePaystackWebhookSecret(providerSettings, env),
        })
      : verifyStripeWebhookSignature({
          rawBody,
          signatureHeader: request.headers.get("stripe-signature"),
          endpointSecret: resolveStripeWebhookSecret(providerSettings, env),
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

function readWebhookConfiguration(value: unknown): {
  readonly webhookSecretReference?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as { webhookSecretReference?: unknown };
  return {
    webhookSecretReference:
      typeof record.webhookSecretReference === "string"
        ? record.webhookSecretReference.trim() || undefined
        : undefined,
  };
}
