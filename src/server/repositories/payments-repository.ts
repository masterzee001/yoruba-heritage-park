import type {
  DonationCampaignRecord,
  PaymentProviderSettingsRecord,
  PaymentRecord,
} from "./repository-types";

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

export interface UpsertDonationCampaignInput {
  readonly campaignCode: string;
  readonly title: string;
  readonly description?: string | null;
  readonly status: DonationCampaignRecord["status"];
  readonly suggestedAmountsMinor: number[];
}

export interface PaymentsRepository {
  list(limit?: number): Promise<PaymentRecord[]>;
  listProviderSettings(): Promise<PaymentProviderSettingsRecord[]>;
  listDonationCampaigns(): Promise<DonationCampaignRecord[]>;
  upsertProviderSettings(
    input: UpsertPaymentProviderSettingsInput,
    updatedByUserId: string,
  ): Promise<PaymentProviderSettingsRecord>;
  upsertDonationCampaign(input: UpsertDonationCampaignInput): Promise<DonationCampaignRecord>;
}
