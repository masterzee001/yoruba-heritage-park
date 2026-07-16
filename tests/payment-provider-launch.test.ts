import { describe, expect, test } from "bun:test";

import {
  buildPaymentWebhookUrl,
  getPaymentProviderLaunchGuides,
  normalisePaymentReturnUrl,
} from "../src/config/payment-provider-launch";

describe("payment provider launch configuration", () => {
  test("normalises internal checkout return paths", () => {
    expect(normalisePaymentReturnUrl("/tickets?checkout=success")).toBe(
      "/tickets?checkout=success",
    );
    expect(normalisePaymentReturnUrl(" /tickets?checkout=cancelled ")).toBe(
      "/tickets?checkout=cancelled",
    );
  });

  test("allows HTTPS checkout return URLs for provider dashboards", () => {
    expect(normalisePaymentReturnUrl("https://example.com/tickets?checkout=success")).toBe(
      "https://example.com/tickets?checkout=success",
    );
  });

  test("rejects unsafe checkout return URLs", () => {
    expect(normalisePaymentReturnUrl("http://example.com/tickets")).toBeUndefined();
    expect(normalisePaymentReturnUrl("//example.com/tickets")).toBeUndefined();
    expect(normalisePaymentReturnUrl("javascript:alert(1)")).toBeUndefined();
    expect(normalisePaymentReturnUrl("https://user:pass@example.com/tickets")).toBeUndefined();
  });

  test("builds provider webhook URLs from the current HTTPS origin", () => {
    expect(buildPaymentWebhookUrl("stripe", "https://preview.example.com/admin/payments")).toBe(
      "https://preview.example.com/api/payments/webhooks/stripe",
    );
    expect(buildPaymentWebhookUrl("paystack", "http://localhost:3000")).toBe(
      "/api/payments/webhooks/paystack",
    );
  });

  test("keeps launch guides available for all configured adapters", () => {
    const guides = getPaymentProviderLaunchGuides("https://preview.example.com");
    expect(guides.map((guide) => guide.providerCode)).toEqual(["paypal", "paystack", "stripe"]);
    expect(guides.every((guide) => guide.callbackUrl.startsWith("https://"))).toBe(true);
  });
});
