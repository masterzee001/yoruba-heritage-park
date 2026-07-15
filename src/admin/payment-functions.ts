import { createServerFn } from "@tanstack/react-start";

import type { AdminPayment, PaymentFilters } from "./types";

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

export interface AdminPaymentProviderReadiness {
  readonly providerCode: string;
  readonly displayName: string;
  readonly adapterCode: string;
  readonly supported: boolean;
  readonly enabled: boolean;
  readonly mode: "test" | "live";
  readonly currency: string;
  readonly integrationReady: boolean;
  readonly liveCaptureEnabled: false;
  readonly capabilities: string[];
  readonly missingConfiguration: string[];
  readonly warnings: string[];
}

export interface AdminDonationCampaign {
  readonly id: string;
  readonly campaignCode: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: "draft" | "active" | "paused" | "archived";
  readonly suggestedAmountsMinor: number[];
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

export interface SaveDonationCampaignInput {
  readonly campaignCode?: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: AdminDonationCampaign["status"];
  readonly suggestedAmountsMinor?: number[];
}

export const listAdminPayments = createServerFn({ method: "GET" })
  .validator((data: PaymentFilters = {}) => data)
  .handler(async ({ data }) => {
    const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    await requireAdminServerPermission("payments.view");
    const payments = await new MysqlPaymentsRepository().list(100);
    return payments.map(toAdminPayment).filter((payment) => matchesPaymentFilters(payment, data));
  });

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

export const listPaymentProviderReadiness = createServerFn({ method: "GET" }).handler(async () => {
  const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
  const { evaluatePaymentProviderSettings } = await import("../server/payments");
  const { requireAdminServerPermission } = await import("./server-permissions");
  await requireAdminServerPermission("payments.view");
  const providers = await new MysqlPaymentsRepository().listProviderSettings();
  return providers.map((provider): AdminPaymentProviderReadiness => {
    const readiness = evaluatePaymentProviderSettings(provider);
    return {
      providerCode: readiness.providerCode,
      displayName: readiness.displayName,
      adapterCode: readiness.adapterCode,
      supported: readiness.supported,
      enabled: readiness.enabled,
      mode: readiness.mode,
      currency: readiness.currency,
      integrationReady: readiness.integrationReady,
      liveCaptureEnabled: readiness.liveCaptureEnabled,
      capabilities: readiness.capabilities,
      missingConfiguration: readiness.missingConfiguration,
      warnings: readiness.warnings,
    };
  });
});

export const listDonationCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
  const { requireAdminServerPermission } = await import("./server-permissions");
  await requireAdminServerPermission("payments.view");
  const campaigns = await new MysqlPaymentsRepository().listDonationCampaigns();
  return campaigns.map(toAdminDonationCampaign);
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

export const saveDonationCampaign = createServerFn({ method: "POST" })
  .validator((data: SaveDonationCampaignInput) => data)
  .handler(async ({ data }) => {
    const campaignCode = data.campaignCode?.trim().toLowerCase();
    const title = data.title?.trim();
    if (!campaignCode || !/^[a-z0-9_-]+$/.test(campaignCode)) {
      return {
        ok: false,
        message: "Campaign code must use lowercase letters, numbers, hyphens or underscores.",
      };
    }
    if (!title) return { ok: false, message: "Campaign title is required." };

    const { MysqlAuditLogRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("payments.manage");
    const repository = new MysqlPaymentsRepository();
    const saved = await repository.upsertDonationCampaign({
      campaignCode,
      title,
      description: data.description,
      status: data.status ?? "draft",
      suggestedAmountsMinor: data.suggestedAmountsMinor ?? [],
    });
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "payments.donation_campaign.saved",
      moduleCode: "payments",
      recordType: "donation_campaign",
      recordId: saved.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        campaignCode: saved.campaignCode,
        status: saved.status,
        paymentCaptureEnabled: false,
      },
    });
    return { ok: true, message: "Donation campaign saved." };
  });

function toAdminPayment(payment: {
  readonly id: string;
  readonly reference: string;
  readonly bookingId: string | null;
  readonly campaignId: string | null;
  readonly payerName: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly providerCode: string;
  readonly providerTransactionReference: string | null;
  readonly status: AdminPayment["status"];
  readonly verificationStatus: AdminPayment["verificationStatus"];
  readonly refundStatus: AdminPayment["refundStatus"];
  readonly createdAt: Date;
}): AdminPayment {
  return {
    id: payment.id,
    reference: payment.reference,
    bookingReference: payment.bookingId ?? payment.campaignId ?? "Unlinked record",
    visitorName: payment.payerName,
    amountNgn: payment.amountMinor / 100,
    currency: "NGN",
    provider: payment.providerCode,
    status: payment.status,
    verificationStatus: payment.verificationStatus,
    createdAt: payment.createdAt.toISOString(),
    refundStatus: payment.refundStatus,
    transactionReferencePlaceholder:
      payment.providerTransactionReference ?? "TRANSACTION-NOT-CAPTURED",
    relatedBookingType: payment.bookingId ? "Booking payment" : "Donation campaign",
    activity: [
      {
        id: `${payment.id}-created`,
        time: payment.createdAt.toISOString(),
        title: "Payment record created",
        detail: "Payment capture remains inactive until provider approval and live integration.",
      },
    ],
    isDemo: false,
  };
}

function toAdminDonationCampaign(campaign: {
  readonly id: string;
  readonly campaignCode: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: AdminDonationCampaign["status"];
  readonly suggestedAmountsJson: unknown;
  readonly updatedAt: Date;
}): AdminDonationCampaign {
  return {
    id: campaign.id,
    campaignCode: campaign.campaignCode,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    suggestedAmountsMinor: Array.isArray(campaign.suggestedAmountsJson)
      ? campaign.suggestedAmountsJson
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

function matchesPaymentFilters(payment: AdminPayment, filters: PaymentFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  const matchesSearch =
    !search ||
    [
      payment.reference,
      payment.bookingReference,
      payment.visitorName,
      payment.transactionReferencePlaceholder,
      payment.relatedBookingType,
    ].some((value) => value.toLowerCase().includes(search));
  const matchesStatus =
    !filters.status || filters.status === "all" || payment.status === filters.status;
  const matchesVerification =
    !filters.verificationStatus ||
    filters.verificationStatus === "all" ||
    payment.verificationStatus === filters.verificationStatus;
  const matchesProvider =
    !filters.provider || filters.provider === "all" || payment.provider === filters.provider;
  const matchesDate = !filters.date || payment.createdAt.startsWith(filters.date);
  return matchesSearch && matchesStatus && matchesVerification && matchesProvider && matchesDate;
}
