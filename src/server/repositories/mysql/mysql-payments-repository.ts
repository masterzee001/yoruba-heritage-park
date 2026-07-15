import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type {
  PaymentsRepository,
  UpsertPaymentProviderSettingsInput,
} from "../payments-repository";
import type { PaymentProviderSettingsRecord, PaymentRecord } from "../repository-types";
import { parseJsonValue, requireCode, requireLimit } from "./mysql-helpers";

interface PaymentRow extends RowDataPacket {
  id: string;
  reference: string;
  booking_id: string | null;
  campaign_id: string | null;
  payer_name: string;
  payer_email: string | null;
  amount_minor: number;
  currency: string;
  provider_code: string;
  provider_transaction_reference: string | null;
  status: PaymentRecord["status"];
  verification_status: PaymentRecord["verificationStatus"];
  refund_status: PaymentRecord["refundStatus"];
  metadata_json: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface PaymentProviderRow extends RowDataPacket {
  id: string;
  provider_code: string;
  display_name: string;
  mode: PaymentProviderSettingsRecord["mode"];
  enabled: 0 | 1;
  public_key: string | null;
  secret_reference: string | null;
  currency: string;
  minimum_amount_minor: number;
  configuration_json: string;
  updated_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class MysqlPaymentsRepository implements PaymentsRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async list(limit = 50): Promise<PaymentRecord[]> {
    try {
      const [rows] = await this.pool.query<PaymentRow[]>(
        `SELECT id, reference, booking_id, campaign_id, payer_name, payer_email, amount_minor,
          currency, provider_code, provider_transaction_reference, status, verification_status,
          refund_status, metadata_json, created_at, updated_at, deleted_at
         FROM payments
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT ?`,
        [requireLimit(limit)],
      );
      return rows.map(mapPayment);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async listProviderSettings(): Promise<PaymentProviderSettingsRecord[]> {
    try {
      const [rows] = await this.pool.query<PaymentProviderRow[]>(
        `SELECT id, provider_code, display_name, mode, enabled, public_key, secret_reference,
          currency, minimum_amount_minor, configuration_json, updated_by_user_id,
          created_at, updated_at
         FROM payment_provider_settings
         ORDER BY display_name ASC`,
      );
      return rows.map(mapProviderSettings);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async upsertProviderSettings(
    input: UpsertPaymentProviderSettingsInput,
    updatedByUserId: string,
  ): Promise<PaymentProviderSettingsRecord> {
    try {
      const providerCode = requireCode(input.providerCode.toLowerCase());
      const id = `pay_provider_${providerCode.replace(/[^a-z0-9_]/g, "_")}`;
      await this.pool.query(
        `INSERT INTO payment_provider_settings (
          id, provider_code, display_name, mode, enabled, public_key, secret_reference,
          currency, minimum_amount_minor, configuration_json, updated_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_OBJECT('configuredBy', 'master_admin', 'liveCaptureEnabled', false), ?)
        ON DUPLICATE KEY UPDATE
          display_name = VALUES(display_name),
          mode = VALUES(mode),
          enabled = VALUES(enabled),
          public_key = VALUES(public_key),
          secret_reference = VALUES(secret_reference),
          currency = VALUES(currency),
          minimum_amount_minor = VALUES(minimum_amount_minor),
          updated_by_user_id = VALUES(updated_by_user_id)`,
        [
          id,
          providerCode,
          input.displayName.trim(),
          input.mode,
          input.enabled ? 1 : 0,
          input.publicKey?.trim() || null,
          input.secretReference?.trim() || null,
          input.currency.trim().toUpperCase(),
          input.minimumAmountMinor,
          updatedByUserId,
        ],
      );
      const providers = await this.listProviderSettings();
      const provider = providers.find((row) => row.providerCode === providerCode);
      if (!provider) throw new Error("Payment provider settings were not saved.");
      return provider;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    reference: row.reference,
    bookingId: row.booking_id,
    campaignId: row.campaign_id,
    payerName: row.payer_name,
    payerEmail: row.payer_email,
    amountMinor: row.amount_minor,
    currency: row.currency,
    providerCode: row.provider_code,
    providerTransactionReference: row.provider_transaction_reference,
    status: row.status,
    verificationStatus: row.verification_status,
    refundStatus: row.refund_status,
    metadataJson: parseJsonValue(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapProviderSettings(row: PaymentProviderRow): PaymentProviderSettingsRecord {
  return {
    id: row.id,
    providerCode: row.provider_code,
    displayName: row.display_name,
    mode: row.mode,
    enabled: row.enabled === 1,
    publicKey: row.public_key,
    secretReference: row.secret_reference,
    currency: row.currency,
    minimumAmountMinor: row.minimum_amount_minor,
    configurationJson: parseJsonValue(row.configuration_json),
    updatedByUserId: row.updated_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
