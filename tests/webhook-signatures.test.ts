import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";

import {
  verifyPayPalWebhookSignature,
  verifyPaystackWebhookSignature,
  verifyStripeWebhookSignature,
} from "../src/server/payments";

describe("payment webhook signature verification", () => {
  test("verifies PayPal webhooks through the PayPal postback API", async () => {
    const payload = {
      id: "WH-TEST",
      event_type: "CHECKOUT.ORDER.APPROVED",
      resource: { id: "PAYPAL-ORDER-TEST" },
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const client = {
      async fetch(input: string | URL, init?: RequestInit) {
        const url = String(input);
        calls.push({ url, init });
        if (url.endsWith("/v1/oauth2/token")) {
          return Response.json({ access_token: "token_test", token_type: "Bearer" });
        }
        return Response.json({ verification_status: "SUCCESS" });
      },
    };

    const result = await verifyPayPalWebhookSignature({
      payload,
      webhookId: "WH-123",
      credentials: {
        environment: "sandbox",
        clientId: "client_test",
        secretKey: "secret_test",
      },
      client,
      headers: new Headers({
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-cert-url": "https://api-m.sandbox.paypal.com/certs/test",
        "paypal-transmission-id": "transmission-test",
        "paypal-transmission-sig": "signature-test",
        "paypal-transmission-time": "2026-01-01T00:00:00Z",
      }),
    });

    expect(result).toEqual({
      ok: true,
      providerCode: "paypal",
      scheme: "paypal-postback",
    });
    expect(calls[1]?.url).toBe(
      "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
    );
    expect(JSON.parse(String(calls[1]?.init?.body))).toMatchObject({
      webhook_id: "WH-123",
      transmission_id: "transmission-test",
      webhook_event: payload,
    });
  });

  test("rejects PayPal webhooks with missing transmission headers", async () => {
    const result = await verifyPayPalWebhookSignature({
      payload: { id: "WH-TEST", event_type: "CHECKOUT.ORDER.APPROVED" },
      webhookId: "WH-123",
      credentials: {
        environment: "sandbox",
        clientId: "client_test",
        secretKey: "secret_test",
      },
      headers: new Headers(),
    });

    expect(result).toEqual({
      ok: false,
      providerCode: "paypal",
      scheme: "paypal-postback",
      reason: "Missing PayPal auth-algo value.",
    });
  });

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
