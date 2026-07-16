import { normalisePaymentCurrency } from "../../config/payment-currencies";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../repositories/repository-types";
import { appendCheckoutReturnParams } from "./checkout-return-url";

export interface PaystackCredentials {
  readonly publicKey: string;
  readonly secretKey: string;
  readonly callbackUrl?: string;
}

export interface PaystackConfigurationResult {
  readonly ok: boolean;
  readonly credentials?: PaystackCredentials;
  readonly missingConfiguration: string[];
}

export interface PaystackTransactionInitializeDraft {
  readonly email: string;
  readonly amount: number;
  readonly currency: "NGN" | "USD";
  readonly reference: string;
  readonly metadata: {
    readonly paymentId: string;
    readonly paymentReference: string;
    readonly source: "yoruba_heritage_park";
  };
  readonly callback_url?: string;
}

export interface PaystackTransactionInitializeResponse {
  readonly status: boolean;
  readonly message: string;
  readonly data?: {
    readonly authorization_url?: string;
    readonly access_code?: string;
    readonly reference?: string;
  };
}

export interface PaystackHttpClient {
  fetch(input: string | URL, init?: RequestInit): Promise<Response>;
}

export class PaystackClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaystackClientError";
  }
}

export function resolvePaystackConfiguration(
  settings: PaymentProviderSettingsRecord,
  env: Record<string, string | undefined> = process.env,
): PaystackConfigurationResult {
  const publicKey = settings.publicKey?.trim() || env.PAYSTACK_PUBLIC_KEY?.trim();
  const secretReference = settings.secretReference?.trim() || "PAYSTACK_SECRET_KEY";
  const secretKey = env[secretReference]?.trim();
  const config = readPaystackConfigurationJson(settings.configurationJson);
  const callbackUrl =
    config.successUrl?.trim() || env.PAYSTACK_CHECKOUT_CALLBACK_URL?.trim() || undefined;
  const missingConfiguration = [
    ...(!publicKey ? ["Paystack public key"] : []),
    ...(!secretKey ? [`${secretReference} environment value`] : []),
  ];

  if (missingConfiguration.length > 0 || !publicKey || !secretKey) {
    return { ok: false, missingConfiguration };
  }

  return {
    ok: true,
    credentials: { publicKey, secretKey, callbackUrl },
    missingConfiguration: [],
  };
}

export function buildPaystackTransactionInitializeDraft(
  payment: PaymentRecord,
  credentials?: Pick<PaystackCredentials, "callbackUrl">,
): PaystackTransactionInitializeDraft {
  return {
    email: payment.payerEmail || "payments@yorubaheritagepark.com",
    amount: Math.max(0, Math.trunc(payment.amountMinor)),
    currency: normalisePaymentCurrency(payment.currency),
    reference: payment.reference,
    metadata: {
      paymentId: payment.id,
      paymentReference: payment.reference,
      source: "yoruba_heritage_park",
    },
    ...(credentials?.callbackUrl
      ? {
          callback_url: appendCheckoutReturnParams(credentials.callbackUrl, {
            status: "success",
            paymentReference: payment.reference,
            providerCode: "paystack",
          }),
        }
      : {}),
  };
}

export async function initializePaystackTransaction(
  credentials: PaystackCredentials,
  payment: PaymentRecord,
  client: PaystackHttpClient = globalThis,
): Promise<PaystackTransactionInitializeResponse> {
  const response = await client.fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPaystackTransactionInitializeDraft(payment, credentials)),
  });

  if (!response.ok) {
    throw new PaystackClientError(
      `Paystack transaction initialization failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as PaystackTransactionInitializeResponse;
  if (!payload.status || !payload.data?.reference) {
    throw new PaystackClientError(
      "Paystack transaction initialization did not return a reference.",
    );
  }
  return payload;
}

function readPaystackConfigurationJson(value: unknown): {
  readonly successUrl?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    successUrl: typeof value.successUrl === "string" ? value.successUrl : undefined,
  };
}
