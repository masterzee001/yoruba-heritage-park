export interface PaymentProviderFormState {
  readonly providerCode: string;
  readonly displayName: string;
  readonly mode: "test" | "live";
  readonly enabled: boolean;
  readonly publicKey: string;
  readonly secretReference: string;
  readonly currency: string;
  readonly minimumAmountMinor: number;
  readonly webhookSecretReference: string;
  readonly webhookIdReference: string;
  readonly webhookId: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

export function updateProviderFormEnabled(
  current: PaymentProviderFormState,
  enabled: boolean,
): PaymentProviderFormState {
  return {
    ...current,
    enabled,
  };
}

export function updateProviderFormMode(
  current: PaymentProviderFormState,
  mode: "test" | "live",
): PaymentProviderFormState {
  return {
    ...current,
    mode,
  };
}

export function updateProviderFormCurrency(
  current: PaymentProviderFormState,
  currency: string,
): PaymentProviderFormState {
  return {
    ...current,
    currency,
  };
}
