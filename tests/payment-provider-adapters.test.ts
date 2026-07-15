import { describe, expect, test } from "bun:test";

import { evaluatePaymentProviderSettings } from "../src/server/payments";
import type { PaymentProviderSettingsRecord } from "../src/server/repositories/repository-types";

describe("payment provider adapters", () => {
  test("evaluates PayPal readiness without enabling live capture", () => {
    const readiness = evaluatePaymentProviderSettings(
      makeProviderSettings({
        providerCode: "paypal",
        displayName: "PayPal",
        enabled: true,
        publicKey: "paypal-client-id",
        secretReference: "PAYPAL_SECRET_KEY",
      }),
      { PAYPAL_SECRET_KEY: "secret-value" },
    );

    expect(readiness.supported).toBe(true);
    expect(readiness.integrationReady).toBe(true);
    expect(readiness.liveCaptureEnabled).toBe(false);
    expect(readiness.capabilities).toContain("checkout_session");
    expect(readiness.capabilities).toContain("webhook_verification");
    expect(readiness.missingConfiguration).toEqual([]);
  });

  test("reports missing PayPal configuration", () => {
    const readiness = evaluatePaymentProviderSettings(
      makeProviderSettings({
        providerCode: "paypal",
        displayName: "PayPal",
        enabled: true,
        publicKey: null,
        secretReference: "PAYPAL_SECRET_KEY",
      }),
      {},
    );

    expect(readiness.integrationReady).toBe(false);
    expect(readiness.missingConfiguration).toEqual([
      "PayPal client ID",
      "PAYPAL_SECRET_KEY environment value",
    ]);
  });

  test("keeps unsupported providers unavailable until an adapter exists", () => {
    const readiness = evaluatePaymentProviderSettings(
      makeProviderSettings({ providerCode: "custom_gateway", displayName: "Custom Gateway" }),
      {},
    );

    expect(readiness.supported).toBe(false);
    expect(readiness.integrationReady).toBe(false);
    expect(readiness.liveCaptureEnabled).toBe(false);
    expect(readiness.missingConfiguration).toEqual(["Supported provider adapter"]);
  });
});

function makeProviderSettings(
  overrides: Partial<PaymentProviderSettingsRecord> = {},
): PaymentProviderSettingsRecord {
  return {
    id: "pay_provider_test",
    providerCode: "pending_configuration",
    displayName: "Pending provider configuration",
    mode: "test",
    enabled: false,
    publicKey: null,
    secretReference: null,
    currency: "NGN",
    minimumAmountMinor: 0,
    configurationJson: {},
    updatedByUserId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
