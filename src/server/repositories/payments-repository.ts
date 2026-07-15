import type { PaymentProviderSettingsRecord, PaymentRecord } from "./repository-types";

export interface UpsertPaymentProviderSettingsInput {
  readonly providerCode: string;
  readonly displayName: string;
  readonly mode: "test" | "live";
  readonly enabled: boolean;
  readonly publicKey?: string | null;
  readonly secretReference?: string | null;
  readonly currency: string;
  readonly minimumAmountMinor: number;
}

export interface PaymentsRepository {
  list(limit?: number): Promise<PaymentRecord[]>;
  listProviderSettings(): Promise<PaymentProviderSettingsRecord[]>;
  upsertProviderSettings(
    input: UpsertPaymentProviderSettingsInput,
    updatedByUserId: string,
  ): Promise<PaymentProviderSettingsRecord>;
}
