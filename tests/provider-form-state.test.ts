import { describe, expect, test } from "bun:test";

import {
  updateProviderFormCurrency,
  updateProviderFormEnabled,
  updateProviderFormMode,
} from "../src/admin/provider-form-state";
import type { PaymentProviderFormState } from "../src/admin/provider-form-state";

describe("payment provider form state helpers", () => {
  test("toggles provider enabled without altering other entered values", () => {
    const current = makeProviderFormState({
      displayName: "Paystack",
      publicKey: "pk_test_123",
      secretReference: "PAYSTACK_SECRET_KEY",
      currency: "NGN",
      enabled: false,
    });

    const enabledState = updateProviderFormEnabled(current, true);

    expect(enabledState.enabled).toBe(true);
    expect(enabledState.displayName).toBe("Paystack");
    expect(enabledState.publicKey).toBe("pk_test_123");
    expect(enabledState.secretReference).toBe("PAYSTACK_SECRET_KEY");
    expect(enabledState.currency).toBe("NGN");

    const disabledState = updateProviderFormEnabled(enabledState, false);
    expect(disabledState.enabled).toBe(false);
    expect(disabledState.publicKey).toBe("pk_test_123");
  });

  test("updates mode and currency independently of the event lifecycle", () => {
    const current = makeProviderFormState({
      mode: "test",
      currency: "NGN",
    });

    const liveState = updateProviderFormMode(current, "live");
    expect(liveState.mode).toBe("live");
    expect(liveState.currency).toBe("NGN");

    const usdState = updateProviderFormCurrency(liveState, "USD");
    expect(usdState.currency).toBe("USD");
    expect(usdState.mode).toBe("live");
  });
});

function makeProviderFormState(
  overrides: Partial<PaymentProviderFormState> = {},
): PaymentProviderFormState {
  return {
    providerCode: "paypal",
    displayName: "PayPal",
    mode: "test",
    enabled: false,
    publicKey: "",
    secretReference: "PAYPAL_SECRET_KEY",
    currency: "NGN",
    minimumAmountMinor: 0,
    webhookSecretReference: "",
    webhookIdReference: "PAYPAL_WEBHOOK_ID",
    webhookId: "",
    successUrl: "/tickets?checkout=success",
    cancelUrl: "/tickets?checkout=cancelled",
    ...overrides,
  };
}
