import type { AdminPaymentProviderReadiness } from "./payment-functions";

export interface BookingPaymentProviderOption {
  readonly providerCode: string;
  readonly displayName: string;
  readonly ready: boolean;
  readonly supported: boolean;
  readonly enabled: boolean;
  readonly integrationReady: boolean;
  readonly missingConfiguration: string[];
  readonly warnings: string[];
  readonly label: string;
  readonly detail: string;
}

export function buildBookingPaymentProviderOptions(
  readiness: AdminPaymentProviderReadiness[],
): BookingPaymentProviderOption[] {
  return readiness.map((provider) => {
    const ready = provider.supported && provider.enabled && provider.integrationReady;
    const status = providerStatusLabel(provider, ready);
    return {
      providerCode: provider.providerCode,
      displayName: provider.displayName,
      ready,
      supported: provider.supported,
      enabled: provider.enabled,
      integrationReady: provider.integrationReady,
      missingConfiguration: provider.missingConfiguration,
      warnings: provider.warnings,
      label: `${provider.displayName} — ${status}`,
      detail: providerDetail(provider, ready),
    };
  });
}

export function selectDefaultBookingPaymentProvider(
  options: BookingPaymentProviderOption[],
  currentValue: string,
  touched: boolean,
): string {
  const trimmedCurrent = currentValue.trim();
  const currentOption = options.find((option) => option.providerCode === trimmedCurrent);

  if (!touched && currentOption?.ready) return currentOption.providerCode;
  if (!touched) return options.find((option) => option.ready)?.providerCode ?? "";
  if (currentOption) return currentOption.providerCode;
  return options.find((option) => option.ready)?.providerCode ?? "";
}

export function getSelectedBookingPaymentProviderOption(
  options: BookingPaymentProviderOption[],
  providerCode: string,
): BookingPaymentProviderOption | null {
  const trimmed = providerCode.trim();
  if (!trimmed) return null;
  return options.find((option) => option.providerCode === trimmed) ?? null;
}

export function getBookingPaymentProviderNotice(
  options: BookingPaymentProviderOption[],
  selectedProviderCode: string,
): { readonly kind: "info" | "warning"; readonly message: string } | null {
  const selected = getSelectedBookingPaymentProviderOption(options, selectedProviderCode);

  if (options.length === 0) {
    return {
      kind: "info",
      message:
        "No payment provider is ready. Complete sandbox provider configuration in Payments settings.",
    };
  }

  if (!selected) {
    const hasReadyProvider = options.some((option) => option.ready);
    return hasReadyProvider
      ? null
      : {
          kind: "info",
          message:
            "No payment provider is ready. Complete sandbox provider configuration in Payments settings.",
        };
  }
  if (selected.ready) return null;

  const missing = selected.missingConfiguration.length
    ? ` Missing: ${selected.missingConfiguration.join(", ")}.`
    : "";
  const warnings = selected.warnings.length ? ` ${selected.warnings[0]}` : "";
  return {
    kind: "warning",
    message: `${selected.displayName} is not ready for payment requests.${missing}${warnings}`,
  };
}

export function canPreparePaymentForProvider(
  options: BookingPaymentProviderOption[],
  selectedProviderCode: string,
): boolean {
  return Boolean(getSelectedBookingPaymentProviderOption(options, selectedProviderCode)?.ready);
}

function providerStatusLabel(provider: AdminPaymentProviderReadiness, ready: boolean): string {
  if (!provider.supported) return "Unsupported";
  if (!provider.enabled) return "Disabled";
  if (!provider.integrationReady) return "Missing configuration";
  if (ready) return "Ready";
  return "Unavailable";
}

function providerDetail(provider: AdminPaymentProviderReadiness, ready: boolean): string {
  if (!provider.supported) {
    return `${provider.displayName} does not have a supported server adapter yet.`;
  }
  if (!provider.enabled) {
    return `${provider.displayName} is disabled in provider settings.`;
  }
  if (!provider.integrationReady) {
    const missing = provider.missingConfiguration.length
      ? ` Missing: ${provider.missingConfiguration.join(", ")}.`
      : "";
    return `${provider.displayName} is not ready for payment requests.${missing}`;
  }
  if (ready) {
    return `${provider.displayName} is ready for payment requests.`;
  }
  return `${provider.displayName} is unavailable for payment requests.`;
}
