import { describe, expect, test } from "bun:test";

import {
  buildBookingPaymentProviderOptions,
  canPreparePaymentForProvider,
  getBookingPaymentProviderNotice,
  selectDefaultBookingPaymentProvider,
} from "../src/admin/booking-payment-ui";
import type { AdminPaymentProviderReadiness } from "../src/admin/payment-functions";

describe("booking payment provider ui helpers", () => {
  test("defaults to the first ready provider and labels readiness clearly", () => {
    const options = buildBookingPaymentProviderOptions([
      makeProviderReadiness({
        providerCode: "paypal",
        displayName: "PayPal",
        enabled: true,
        integrationReady: false,
        missingConfiguration: ["PAYPAL_SECRET_KEY environment value"],
      }),
      makeProviderReadiness({
        providerCode: "paystack",
        displayName: "Paystack",
        enabled: true,
        integrationReady: true,
      }),
    ]);

    expect(options[0]?.label).toBe("PayPal — Missing configuration");
    expect(options[0]?.detail).toContain("PAYPAL_SECRET_KEY environment value");
    expect(options[1]?.label).toBe("Paystack — Ready");
    expect(selectDefaultBookingPaymentProvider(options, "", false)).toBe("paystack");
    expect(canPreparePaymentForProvider(options, "paypal")).toBe(false);
    expect(canPreparePaymentForProvider(options, "paystack")).toBe(true);
  });

  test("keeps the page visible and disables payment actions when no provider is ready", () => {
    const options = buildBookingPaymentProviderOptions([
      makeProviderReadiness({
        providerCode: "paypal",
        displayName: "PayPal",
        enabled: false,
        integrationReady: false,
        missingConfiguration: ["PAYPAL_SECRET_KEY environment value"],
        warnings: ["Disabled in provider settings."],
      }),
      makeProviderReadiness({
        providerCode: "paystack",
        displayName: "Paystack",
        enabled: false,
        integrationReady: false,
        missingConfiguration: ["PAYSTACK_SECRET_KEY environment value"],
      }),
    ]);

    expect(selectDefaultBookingPaymentProvider(options, "", false)).toBe("");
    expect(canPreparePaymentForProvider(options, "")).toBe(false);
    expect(getBookingPaymentProviderNotice(options, "")).toEqual({
      kind: "info",
      message:
        "No payment provider is ready. Complete sandbox provider configuration in Payments settings.",
    });
  });

  test("preserves a manually selected provider when the list is already loaded", () => {
    const options = buildBookingPaymentProviderOptions([
      makeProviderReadiness({
        providerCode: "stripe",
        displayName: "Stripe",
        enabled: true,
        integrationReady: true,
      }),
    ]);

    expect(selectDefaultBookingPaymentProvider(options, "stripe", true)).toBe("stripe");
    expect(getBookingPaymentProviderNotice(options, "stripe")).toBeNull();
  });
});

function makeProviderReadiness(
  overrides: Partial<AdminPaymentProviderReadiness> = {},
): AdminPaymentProviderReadiness {
  return {
    providerCode: "pending_configuration",
    displayName: "Pending provider configuration",
    adapterCode: "pending_adapter",
    supported: true,
    enabled: false,
    integrationReady: false,
    mode: "test",
    currency: "NGN",
    missingConfiguration: [],
    warnings: [],
    capabilities: [],
    liveCaptureEnabled: false,
    checkoutAvailable: false,
    ...overrides,
  };
}
