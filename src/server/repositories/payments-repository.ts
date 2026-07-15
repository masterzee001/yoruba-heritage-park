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

export interface CreatePaymentRecordInput {
  readonly reference: string;
  readonly bookingId?: string | null;
  readonly campaignId?: string | null;
  readonly payerName: string;
  readonly payerEmail?: string | null;
  readonly amountMinor: number;
  readonly currency: string;
  readonly providerCode: string;
  readonly providerTransactionReference?: string | null;
  readonly status?: PaymentRecord["status"];
  readonly verificationStatus?: PaymentRecord["verificationStatus"];
  readonly refundStatus?: PaymentRecord["refundStatus"];
  readonly metadataJson?: unknown;
}

export interface UpdatePaymentCheckoutPreparationInput {
  readonly providerTransactionReference: string;
  readonly metadataJson: unknown;
}

export interface PaymentsRepository {
  list(limit?: number): Promise<PaymentRecord[]>;
  findByReference(reference: string): Promise<PaymentRecord | null>;
  listForBooking(bookingId: string): Promise<PaymentRecord[]>;
  listProviderSettings(): Promise<PaymentProviderSettingsRecord[]>;
  listDonationCampaigns(): Promise<DonationCampaignRecord[]>;
  create(input: CreatePaymentRecordInput): Promise<PaymentRecord>;
  updateCheckoutPreparation(
    paymentId: string,
    input: UpdatePaymentCheckoutPreparationInput,
  ): Promise<PaymentRecord>;
  upsertProviderSettings(
    input: UpsertPaymentProviderSettingsInput,
    updatedByUserId: string,
  ): Promise<PaymentProviderSettingsRecord>;
  upsertDonationCampaign(input: UpsertDonationCampaignInput): Promise<DonationCampaignRecord>;
}
