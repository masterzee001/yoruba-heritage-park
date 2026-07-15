export type SupportedPaymentCurrency = "NGN" | "USD";

export interface PaymentCurrencyOption {
  readonly code: SupportedPaymentCurrency;
  readonly label: string;
  readonly countryContext: string;
}

export const supportedPaymentCurrencies: PaymentCurrencyOption[] = [
  { code: "NGN", label: "Nigerian naira", countryContext: "Nigeria" },
  { code: "USD", label: "US dollar", countryContext: "International / United States" },
];

export function normalisePaymentCurrency(
  value: string | null | undefined,
): SupportedPaymentCurrency {
  const currency = value?.trim().toUpperCase();
  if (currency === "USD") return "USD";
  return "NGN";
}

export function isSupportedPaymentCurrency(
  value: string | null | undefined,
): value is SupportedPaymentCurrency {
  return supportedPaymentCurrencies.some(
    (currency) => currency.code === value?.trim().toUpperCase(),
  );
}

export function formatPaymentAmount(amountMinor: number, currency: string): string {
  const normalised = normalisePaymentCurrency(currency);
  return `${normalised} ${(amountMinor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
