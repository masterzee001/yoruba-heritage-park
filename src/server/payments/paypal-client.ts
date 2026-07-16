import { normalisePaymentCurrency } from "../../config/payment-currencies";
import type {
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "../repositories/repository-types";
import { appendCheckoutReturnParams } from "./checkout-return-url";

export type PayPalEnvironment = "sandbox" | "live";

export interface PayPalCredentials {
  readonly environment: PayPalEnvironment;
  readonly clientId: string;
  readonly secretKey: string;
  readonly successUrl?: string;
  readonly cancelUrl?: string;
}

export interface PayPalConfigurationResult {
  readonly ok: boolean;
  readonly credentials?: PayPalCredentials;
  readonly missingConfiguration: string[];
}

export interface PayPalOrderDraft {
  readonly intent: "CAPTURE";
  readonly purchase_units: [
    {
      readonly reference_id: string;
      readonly amount: {
        readonly currency_code: "NGN" | "USD";
        readonly value: string;
      };
      readonly description: string;
      readonly custom_id: string;
    },
  ];
  readonly application_context?: {
    readonly return_url: string;
    readonly cancel_url: string;
  };
}

export interface PayPalOrderResponse {
  readonly id: string;
  readonly status: string;
  readonly links?: Array<{
    readonly href: string;
    readonly rel: string;
    readonly method: string;
  }>;
}

export interface PayPalAccessTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in?: number;
}

export interface PayPalHttpClient {
  fetch(input: string | URL, init?: RequestInit): Promise<Response>;
}

export class PayPalClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayPalClientError";
  }
}

export function resolvePayPalBaseUrl(environment: PayPalEnvironment): string {
  return environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function resolvePayPalConfiguration(
  settings: PaymentProviderSettingsRecord,
  env: Record<string, string | undefined> = process.env,
): PayPalConfigurationResult {
  const environment = resolvePayPalEnvironment(env.PAYPAL_ENVIRONMENT, settings.mode);
  const clientId = settings.publicKey?.trim() || env.PAYPAL_CLIENT_ID?.trim();
  const secretReference = settings.secretReference?.trim() || "PAYPAL_SECRET_KEY";
  const secretKey = env[secretReference]?.trim();
  const config = readPayPalConfigurationJson(settings.configurationJson);
  const successUrl =
    config.successUrl?.trim() || env.PAYPAL_CHECKOUT_SUCCESS_URL?.trim() || undefined;
  const cancelUrl = config.cancelUrl?.trim() || env.PAYPAL_CHECKOUT_CANCEL_URL?.trim() || undefined;
  const missingConfiguration = [
    ...(!clientId ? ["PayPal client ID"] : []),
    ...(!secretKey ? [`${secretReference} environment value`] : []),
  ];

  if (missingConfiguration.length > 0 || !clientId || !secretKey) {
    return { ok: false, missingConfiguration };
  }

  return {
    ok: true,
    credentials: { environment, clientId, secretKey, successUrl, cancelUrl },
    missingConfiguration: [],
  };
}

export function buildPayPalOrderDraft(
  payment: PaymentRecord,
  credentials?: Pick<PayPalCredentials, "successUrl" | "cancelUrl">,
): PayPalOrderDraft {
  const currency = normalisePaymentCurrency(payment.currency);
  return {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: payment.reference,
        amount: {
          currency_code: currency,
          value: formatMinorAmount(payment.amountMinor),
        },
        description: "Yoruba Heritage Park payment request",
        custom_id: payment.id,
      },
    ],
    ...(credentials?.successUrl && credentials.cancelUrl
      ? {
          application_context: {
            return_url: appendCheckoutReturnParams(credentials.successUrl, {
              status: "success",
              paymentReference: payment.reference,
              providerCode: "paypal",
            }),
            cancel_url: appendCheckoutReturnParams(credentials.cancelUrl, {
              status: "cancelled",
              paymentReference: payment.reference,
              providerCode: "paypal",
            }),
          },
        }
      : {}),
  };
}

export async function requestPayPalAccessToken(
  credentials: PayPalCredentials,
  client: PayPalHttpClient = globalThis,
): Promise<PayPalAccessTokenResponse> {
  const response = await client.fetch(
    `${resolvePayPalBaseUrl(credentials.environment)}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.secretKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );

  if (!response.ok) {
    throw new PayPalClientError(
      `PayPal access token request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as PayPalAccessTokenResponse;
}

export async function createPayPalOrder(
  credentials: PayPalCredentials,
  payment: PaymentRecord,
  client: PayPalHttpClient = globalThis,
): Promise<PayPalOrderResponse> {
  const token = await requestPayPalAccessToken(credentials, client);
  const response = await client.fetch(
    `${resolvePayPalBaseUrl(credentials.environment)}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `${token.token_type} ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPayPalOrderDraft(payment, credentials)),
    },
  );

  if (!response.ok) {
    throw new PayPalClientError(`PayPal order request failed with status ${response.status}.`);
  }

  return (await response.json()) as PayPalOrderResponse;
}

function readPayPalConfigurationJson(value: unknown): {
  readonly successUrl?: string;
  readonly cancelUrl?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    successUrl: typeof value.successUrl === "string" ? value.successUrl : undefined,
    cancelUrl: typeof value.cancelUrl === "string" ? value.cancelUrl : undefined,
  };
}

function resolvePayPalEnvironment(
  envValue: string | undefined,
  providerMode: PaymentProviderSettingsRecord["mode"],
): PayPalEnvironment {
  if (envValue === "live") return "live";
  if (envValue === "sandbox") return "sandbox";
  return providerMode === "live" ? "live" : "sandbox";
}

function formatMinorAmount(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}
