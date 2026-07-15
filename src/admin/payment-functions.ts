import { createServerFn } from "@tanstack/react-start";

export interface AdminPaymentProviderSettings {
  readonly id: string;
  readonly providerCode: string;
  readonly displayName: string;
  readonly mode: "test" | "live";
  readonly enabled: boolean;
  readonly publicKey: string | null;
  readonly secretReference: string | null;
  readonly currency: string;
  readonly minimumAmountMinor: number;
  readonly updatedAt: string;
}

export interface SavePaymentProviderSettingsInput {
  readonly providerCode?: string;
  readonly displayName?: string;
  readonly mode?: "test" | "live";
  readonly enabled?: boolean;
  readonly publicKey?: string | null;
  readonly secretReference?: string | null;
  readonly currency?: string;
  readonly minimumAmountMinor?: number;
}

export const listPaymentProviderSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
  const { requireAdminServerPermission } = await import("./server-permissions");
  await requireAdminServerPermission("payments.view");
  const providers = await new MysqlPaymentsRepository().listProviderSettings();
  return providers.map((provider) => ({
    id: provider.id,
    providerCode: provider.providerCode,
    displayName: provider.displayName,
    mode: provider.mode,
    enabled: provider.enabled,
    publicKey: provider.publicKey,
    secretReference: provider.secretReference,
    currency: provider.currency,
    minimumAmountMinor: provider.minimumAmountMinor,
    updatedAt: provider.updatedAt.toISOString(),
  }));
});

export const savePaymentProviderSettings = createServerFn({ method: "POST" })
  .validator((data: SavePaymentProviderSettingsInput) => data)
  .handler(async ({ data }) => {
    const providerCode = data.providerCode?.trim().toLowerCase();
    const displayName = data.displayName?.trim();
    const currency = data.currency?.trim().toUpperCase() || "NGN";
    if (!providerCode || !/^[a-z0-9_]+$/.test(providerCode)) {
      return {
        ok: false,
        message: "Provider code must use lowercase letters, numbers or underscores.",
      };
    }
    if (!displayName) return { ok: false, message: "Provider display name is required." };
    if (currency.length !== 3) return { ok: false, message: "Currency must be a 3-letter code." };

    const { MysqlAuditLogRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("payments.manage");
    const repository = new MysqlPaymentsRepository();
    const saved = await repository.upsertProviderSettings(
      {
        providerCode,
        displayName,
        mode: data.mode === "live" ? "live" : "test",
        enabled: Boolean(data.enabled),
        publicKey: data.publicKey ?? null,
        secretReference: data.secretReference ?? null,
        currency,
        minimumAmountMinor: Math.max(0, Math.trunc(data.minimumAmountMinor ?? 0)),
      },
      principal.userId,
    );
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "payments.provider_settings.saved",
      moduleCode: "payments",
      recordType: "payment_provider_settings",
      recordId: saved.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        providerCode: saved.providerCode,
        mode: saved.mode,
        enabled: saved.enabled,
        hasPublicKey: Boolean(saved.publicKey),
        hasSecretReference: Boolean(saved.secretReference),
      },
    });
    return { ok: true, message: "Payment provider settings saved." };
  });
