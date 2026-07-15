import { createHmac, timingSafeEqual } from "node:crypto";

export type WebhookSignatureVerificationResult =
  | {
      readonly ok: true;
      readonly providerCode: "paystack" | "stripe";
      readonly scheme: "hmac-sha512" | "stripe-v1";
    }
  | {
      readonly ok: false;
      readonly providerCode: "paystack" | "stripe";
      readonly scheme: "hmac-sha512" | "stripe-v1";
      readonly reason: string;
    };

export function verifyPaystackWebhookSignature(input: {
  readonly rawBody: string;
  readonly signature: string | null | undefined;
  readonly secretKey: string | null | undefined;
}): WebhookSignatureVerificationResult {
  const signature = input.signature?.trim();
  const secretKey = input.secretKey?.trim();
  if (!signature) return failedPaystack("Missing x-paystack-signature header.");
  if (!secretKey) return failedPaystack("Missing Paystack webhook secret key.");

  const expected = createHmac("sha512", secretKey).update(input.rawBody).digest("hex");
  return safeEqualHex(signature, expected)
    ? { ok: true, providerCode: "paystack", scheme: "hmac-sha512" }
    : failedPaystack("Paystack webhook signature mismatch.");
}

export function verifyStripeWebhookSignature(input: {
  readonly rawBody: string;
  readonly signatureHeader: string | null | undefined;
  readonly endpointSecret: string | null | undefined;
  readonly toleranceSeconds?: number;
  readonly nowSeconds?: number;
}): WebhookSignatureVerificationResult {
  const endpointSecret = input.endpointSecret?.trim();
  if (!input.signatureHeader?.trim()) return failedStripe("Missing Stripe-Signature header.");
  if (!endpointSecret) return failedStripe("Missing Stripe webhook endpoint secret.");

  const parsed = parseStripeSignatureHeader(input.signatureHeader);
  if (!parsed.timestamp || parsed.signatures.length === 0) {
    return failedStripe("Stripe-Signature header is missing timestamp or v1 signature.");
  }

  const toleranceSeconds = input.toleranceSeconds ?? 300;
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
    return failedStripe("Stripe webhook timestamp is outside the allowed tolerance.");
  }

  const signedPayload = `${parsed.timestamp}.${input.rawBody}`;
  const expected = createHmac("sha256", endpointSecret).update(signedPayload).digest("hex");
  const matched = parsed.signatures.some((signature) => safeEqualHex(signature, expected));
  return matched
    ? { ok: true, providerCode: "stripe", scheme: "stripe-v1" }
    : failedStripe("Stripe webhook signature mismatch.");
}

function parseStripeSignatureHeader(header: string): {
  readonly timestamp: number | null;
  readonly signatures: string[];
} {
  const parts = header.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const timestamp = timestampPart ? Number(timestampPart.slice(2)) : NaN;
  return {
    timestamp: Number.isInteger(timestamp) ? timestamp : null,
    signatures: parts
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3))
      .filter(Boolean),
  };
}

function safeEqualHex(actual: string, expected: string): boolean {
  if (!/^[a-f0-9]+$/i.test(actual) || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function failedPaystack(reason: string): WebhookSignatureVerificationResult {
  return { ok: false, providerCode: "paystack", scheme: "hmac-sha512", reason };
}

function failedStripe(reason: string): WebhookSignatureVerificationResult {
  return { ok: false, providerCode: "stripe", scheme: "stripe-v1", reason };
}
