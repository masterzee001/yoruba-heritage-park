import type { PaymentProviderSettingsRecord } from "../repositories/repository-types";

export type PaymentProviderCapability =
  | "checkout_session"
  | "webhook_verification"
  | "refund_review";

export interface PaymentProviderReadiness {
  readonly providerCode: string;
  readonly displayName: string;
  readonly adapterCode: string;
  readonly supported: boolean;
  readonly enabled: boolean;
  readonly mode: "test" | "live";
  readonly currency: string;
  readonly integrationReady: boolean;
  readonly liveCaptureEnabled: false;
  readonly capabilities: PaymentProviderCapability[];
  readonly missingConfiguration: string[];
  readonly warnings: string[];
}

export interface PaymentProviderAdapter {
  readonly adapterCode: string;
  readonly providerCode: string;
  readonly displayName: string;
  readonly capabilities: PaymentProviderCapability[];
  evaluate(
    settings: PaymentProviderSettingsRecord,
    env: Record<string, string | undefined>,
  ): PaymentProviderReadiness;
}

export function baseProviderReadiness(
  adapter: PaymentProviderAdapter,
  settings: PaymentProviderSettingsRecord,
  missingConfiguration: string[],
  warnings: string[],
): PaymentProviderReadiness {
  return {
    providerCode: settings.providerCode,
    displayName: settings.displayName || adapter.displayName,
    adapterCode: adapter.adapterCode,
    supported: true,
    enabled: settings.enabled,
    mode: settings.mode,
    currency: settings.currency,
    integrationReady: settings.enabled && missingConfiguration.length === 0,
    liveCaptureEnabled: false,
    capabilities: adapter.capabilities,
    missingConfiguration,
    warnings,
  };
}

export function evaluateSecretReference(
  secretReference: string | null,
  env: Record<string, string | undefined>,
): string[] {
  if (!secretReference?.trim()) return ["Secret environment reference"];
  return env[secretReference.trim()]?.trim() ? [] : [`${secretReference.trim()} environment value`];
}
