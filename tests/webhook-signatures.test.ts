import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";

import {
  verifyPaystackWebhookSignature,
  verifyStripeWebhookSignature,
} from "../src/server/payments";

describe("payment webhook signature verification", () => {
  test("verifies Paystack HMAC SHA-512 signatures over the raw body", () => {
    const rawBody = JSON.stringify({
      event: "charge.success",
      data: { reference: "YHP-PAY-TEST" },
    });
    const secretKey = "sk_test_paystack";
    const signature = createHmac("sha512", secretKey).update(rawBody).digest("hex");

    expect(
      verifyPaystackWebhookSignature({
        rawBody,
        signature,
        secretKey,
      }),
    ).toEqual({
      ok: true,
      providerCode: "paystack",
      scheme: "hmac-sha512",
    });
  });

  test("rejects Paystack signature mismatches", () => {
    expect(
      verifyPaystackWebhookSignature({
        rawBody: "{}",
        signature: "00",
        secretKey: "sk_test_paystack",
      }),
    ).toEqual({
      ok: false,
      providerCode: "paystack",
      scheme: "hmac-sha512",
      reason: "Paystack webhook signature mismatch.",
    });
  });

  test("verifies Stripe v1 signatures over timestamp and raw body", () => {
    const rawBody = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const endpointSecret = "whsec_test";
    const timestamp = 1_785_000_000;
    const signature = createHmac("sha256", endpointSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    expect(
      verifyStripeWebhookSignature({
        rawBody,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        endpointSecret,
        nowSeconds: timestamp,
      }),
    ).toEqual({
      ok: true,
      providerCode: "stripe",
      scheme: "stripe-v1",
    });
  });

  test("rejects stale Stripe timestamps", () => {
    expect(
      verifyStripeWebhookSignature({
        rawBody: "{}",
        signatureHeader: "t=100,v1=abc",
        endpointSecret: "whsec_test",
        nowSeconds: 1_000,
      }),
    ).toEqual({
      ok: false,
      providerCode: "stripe",
      scheme: "stripe-v1",
      reason: "Stripe webhook timestamp is outside the allowed tolerance.",
    });
  });
});
