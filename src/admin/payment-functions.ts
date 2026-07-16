import { createServerFn } from "@tanstack/react-start";

import { isSupportedPaymentCurrency, normalisePaymentCurrency } from "../config/payment-currencies";
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
  readonly configuration: AdminPaymentProviderConfiguration;
  readonly updatedAt: string;
}

export interface AdminPaymentProviderConfiguration {
  readonly webhookSecretReference?: string;
  readonly webhookIdReference?: string;
  readonly webhookId?: string;
  readonly successUrl?: string;
  readonly cancelUrl?: string;
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

export interface AdminPaymentWebhookEvent {
  readonly id: string;
  readonly providerCode: string;
  readonly providerEventId: string;
  readonly eventType: string;
  readonly paymentReference: string | null;
  readonly processingStatus: "received" | "ignored" | "review_required" | "processed" | "failed";
  readonly verificationStatus: "unverified" | "verified" | "failed" | "not_applicable";
  readonly receivedAt: string;
  readonly processedAt: string | null;
  readonly matchedBy: string | null;
  readonly statusMutationApplied: boolean;
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
  readonly webhookSecretReference?: string | null;
  readonly webhookIdReference?: string | null;
  readonly webhookId?: string | null;
  readonly successUrl?: string | null;
  readonly cancelUrl?: string | null;
}

export interface SaveDonationCampaignInput {
  readonly campaignCode?: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: AdminDonationCampaign["status"];
  readonly suggestedAmountsMinor?: number[];
}

export interface PrepareBookingPaymentRequestInput {
  readonly bookingId?: string;
  readonly providerCode?: string;
  readonly amountMinor?: number;
  readonly currency?: string;
}

export type PrepareBookingPaymentLinkInput = PrepareBookingPaymentRequestInput;

export interface PrepareBookingPaymentLinkResult {
  readonly ok: boolean;
  readonly message: string;
  readonly paymentReference?: string;
  readonly checkoutUrl?: string | null;
  readonly providerCode?: string;
  readonly providerOrderId?: string;
  readonly sandbox?: boolean;
  readonly visitorName?: string;
  readonly visitorEmail?: string | null;
  readonly bookingReference?: string;
  readonly missingConfiguration?: string[];
}

export interface PreparePaymentCheckoutInput {
  readonly paymentReference?: string;
}

export interface ReconcilePaymentWebhookEventInput {
  readonly webhookEventId?: string;
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
    configuration: toAdminPaymentProviderConfiguration(provider.configurationJson),
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

export const listPaymentWebhookEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
  const { requireAdminServerPermission } = await import("./server-permissions");
  await requireAdminServerPermission("payments.view");
  const events = await new MysqlPaymentsRepository().listWebhookEvents(25);
  return events.map(toAdminPaymentWebhookEvent);
});

export const savePaymentProviderSettings = createServerFn({ method: "POST" })
  .validator((data: SavePaymentProviderSettingsInput) => data)
  .handler(async ({ data }) => {
    const providerCode = data.providerCode?.trim().toLowerCase();
    const displayName = data.displayName?.trim();
    const requestedCurrency = data.currency?.trim().toUpperCase() || "NGN";
    if (!isSupportedPaymentCurrency(requestedCurrency)) {
      return { ok: false, message: "Currency must be NGN or USD." };
    }
    const currency = normalisePaymentCurrency(requestedCurrency);
    const configuration = buildProviderConfiguration(data);
    if (!providerCode || !/^[a-z0-9_]+$/.test(providerCode)) {
      return {
        ok: false,
        message: "Provider code must use lowercase letters, numbers or underscores.",
      };
    }
    if (!displayName) return { ok: false, message: "Provider display name is required." };

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
        configurationJson: configuration,
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
        configurationKeys: Object.keys(configuration),
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

export const prepareBookingPaymentRequest = createServerFn({ method: "POST" })
  .validator((data: PrepareBookingPaymentRequestInput) => data)
  .handler(async ({ data }) => {
    if (!data.bookingId) return { ok: false, message: "Booking id is required." };
    const providerCode = data.providerCode?.trim().toLowerCase() || "paypal";
    const amountMinor = Math.trunc(data.amountMinor ?? 0);
    const requestedCurrency = data.currency?.trim().toUpperCase() || "NGN";
    const currency = normalisePaymentCurrency(requestedCurrency);
    if (!providerCode) return { ok: false, message: "Payment provider is required." };
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      return { ok: false, message: "Approved payment amount must be greater than zero." };
    }
    if (!isSupportedPaymentCurrency(requestedCurrency)) {
      return { ok: false, message: "Payment currency must be NGN or USD." };
    }

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { PaymentRequestService } = await import("../server/payments");
    const { MysqlAuditLogRepository, MysqlBookingsRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("payments.manage");
    const booking = await new MysqlBookingsRepository().findById(data.bookingId);
    if (!booking || booking.deletedAt) return { ok: false, message: "Booking was not found." };
    if (booking.status === "cancelled" || booking.status === "refunded") {
      return { ok: false, message: "Payment request cannot be prepared for this booking status." };
    }

    const repository = new MysqlPaymentsRepository();
    const result = await new PaymentRequestService(repository).prepare({
      bookingId: booking.id,
      payerName: booking.visitorName,
      payerEmail: booking.visitorEmail,
      amountMinor,
      currency,
      providerCode,
    });

    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "payments.booking_request.prepare",
      moduleCode: "payments",
      recordType: "booking",
      recordId: booking.id,
      outcome: result.ok ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        bookingReference: booking.reference,
        providerCode,
        amountMinor,
        currency,
        paymentReference: result.ok ? result.payment.reference : null,
        message: result.message,
      },
    });

    if (!result.ok) return result;
    return {
      ok: true,
      paymentReference: result.payment.reference,
      message: `Payment request ${result.payment.reference} prepared. Checkout remains inactive.`,
    };
  });

export const prepareBookingPaymentLink = createServerFn({ method: "POST" })
  .validator((data: PrepareBookingPaymentLinkInput) => data)
  .handler(async ({ data }): Promise<PrepareBookingPaymentLinkResult> => {
    if (!data.bookingId) return { ok: false, message: "Booking id is required." };
    const providerCode = data.providerCode?.trim().toLowerCase() || "paypal";
    const amountMinor = Math.trunc(data.amountMinor ?? 0);
    const requestedCurrency = data.currency?.trim().toUpperCase() || "NGN";
    const currency = normalisePaymentCurrency(requestedCurrency);
    if (!providerCode) return { ok: false, message: "Payment provider is required." };
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      return { ok: false, message: "Approved payment amount must be greater than zero." };
    }
    if (!isSupportedPaymentCurrency(requestedCurrency)) {
      return { ok: false, message: "Payment currency must be NGN or USD." };
    }

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { PaymentCheckoutService, PaymentRequestService } = await import("../server/payments");
    const { MysqlAuditLogRepository, MysqlBookingsRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("payments.manage");
    const booking = await new MysqlBookingsRepository().findById(data.bookingId);
    if (!booking || booking.deletedAt) return { ok: false, message: "Booking was not found." };
    if (booking.status === "cancelled" || booking.status === "refunded") {
      return { ok: false, message: "Payment link cannot be prepared for this booking status." };
    }

    const repository = new MysqlPaymentsRepository();
    const existingPayments = await repository.listForBooking(booking.id);
    const reusablePayment = existingPayments.find(
      (payment) =>
        payment.status === "pending" &&
        payment.amountMinor === amountMinor &&
        payment.currency === currency &&
        payment.providerCode === providerCode &&
        !payment.deletedAt,
    );
    const blockingPayment = existingPayments.find(
      (payment) =>
        ["pending", "successful", "refund_pending"].includes(payment.status) &&
        payment.id !== reusablePayment?.id &&
        !payment.deletedAt,
    );

    if (blockingPayment) {
      return {
        ok: false,
        paymentReference: blockingPayment.reference,
        message: `Booking already has an open payment request: ${blockingPayment.reference}.`,
      };
    }

    const requestResult =
      reusablePayment ??
      (await new PaymentRequestService(repository).prepare({
        bookingId: booking.id,
        payerName: booking.visitorName,
        payerEmail: booking.visitorEmail,
        amountMinor,
        currency,
        providerCode,
      }));

    const payment =
      "ok" in requestResult ? (requestResult.ok ? requestResult.payment : null) : requestResult;
    if (!payment) {
      const failure = requestResult as { message: string; missingConfiguration?: string[] };
      return {
        ok: false,
        message: failure.message,
        missingConfiguration: failure.missingConfiguration,
      };
    }

    const checkoutResult = await new PaymentCheckoutService(repository).prepare({
      paymentReference: payment.reference,
    });
    const requestContext = getRuntimeRequestContext();

    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "payments.booking_link.prepare",
      moduleCode: "payments",
      recordType: "booking",
      recordId: booking.id,
      outcome: checkoutResult.ok ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        bookingReference: booking.reference,
        paymentReference: payment.reference,
        providerCode,
        amountMinor,
        currency,
        checkoutUrlPrepared: checkoutResult.ok ? Boolean(checkoutResult.checkoutUrl) : false,
        providerOrderId: checkoutResult.ok ? checkoutResult.providerOrderId : null,
        message: checkoutResult.message,
      },
    });

    if (!checkoutResult.ok) {
      return {
        ok: false,
        paymentReference: payment.reference,
        message: checkoutResult.message,
        missingConfiguration: checkoutResult.missingConfiguration,
      };
    }

    return {
      ok: true,
      paymentReference: checkoutResult.paymentReference,
      checkoutUrl: checkoutResult.checkoutUrl,
      providerCode: checkoutResult.providerCode,
      providerOrderId: checkoutResult.providerOrderId,
      sandbox: checkoutResult.sandbox,
      visitorName: booking.visitorName,
      visitorEmail: booking.visitorEmail,
      bookingReference: booking.reference,
      message: checkoutResult.checkoutUrl
        ? `Payment link prepared for ${booking.reference}.`
        : `Checkout was prepared for ${booking.reference}, but the provider did not return a link.`,
    };
  });

export const preparePaymentCheckout = createServerFn({ method: "POST" })
  .validator((data: PreparePaymentCheckoutInput) => data)
  .handler(async ({ data }) => {
    const paymentReference = data.paymentReference?.trim();
    if (!paymentReference) return { ok: false, message: "Payment reference is required." };

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { PaymentCheckoutService } = await import("../server/payments");
    const { MysqlAuditLogRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("payments.manage");
    const repository = new MysqlPaymentsRepository();
    const result = await new PaymentCheckoutService(repository).prepare({ paymentReference });
    const requestContext = getRuntimeRequestContext();

    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "payments.checkout.prepare",
      moduleCode: "payments",
      recordType: "payment",
      recordId: paymentReference,
      outcome: result.ok ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        paymentReference,
        providerCode: result.ok ? result.providerCode : null,
        providerOrderId: result.ok ? result.providerOrderId : null,
        checkoutUrlPrepared: result.ok ? Boolean(result.checkoutUrl) : false,
        sandbox: result.ok ? result.sandbox : null,
        message: result.message,
      },
    });

    return result;
  });

export const reconcilePaymentWebhookEvent = createServerFn({ method: "POST" })
  .validator((data: ReconcilePaymentWebhookEventInput) => data)
  .handler(async ({ data }) => {
    const webhookEventId = data.webhookEventId?.trim();
    if (!webhookEventId) return { ok: false, message: "Webhook event id is required." };

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { PaymentReconciliationService } = await import("../server/payments");
    const { MysqlAuditLogRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("payments.manage");
    const repository = new MysqlPaymentsRepository();
    const result = await new PaymentReconciliationService(repository).applyVerifiedWebhookEvent(
      webhookEventId,
      principal.userId,
    );
    const requestContext = getRuntimeRequestContext();

    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "payments.webhook.reconcile",
      moduleCode: "payments",
      recordType: "payment_webhook_event",
      recordId: webhookEventId,
      outcome: result.ok ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        webhookEventId,
        paymentReference: result.ok ? result.payment.reference : null,
        providerCode: result.ok ? result.event.providerCode : null,
        bookingPaymentStateApplied: result.ok ? result.bookingPaymentStateApplied : false,
        message: result.message,
      },
    });

    return result.ok
      ? {
          ok: true,
          message: result.message,
          paymentReference: result.payment.reference,
          bookingPaymentStateApplied: result.bookingPaymentStateApplied,
        }
      : result;
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
    currency: payment.currency,
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

function buildProviderConfiguration(
  input: SavePaymentProviderSettingsInput,
): AdminPaymentProviderConfiguration {
  const configuration: {
    webhookSecretReference?: string;
    webhookIdReference?: string;
    webhookId?: string;
    successUrl?: string;
    cancelUrl?: string;
  } = {};
  const webhookSecretReference = normaliseEnvReference(input.webhookSecretReference);
  const webhookIdReference = normaliseEnvReference(input.webhookIdReference);
  const webhookId = normalisePlainText(input.webhookId);
  const successUrl = normaliseInternalUrl(input.successUrl);
  const cancelUrl = normaliseInternalUrl(input.cancelUrl);

  if (webhookSecretReference) configuration.webhookSecretReference = webhookSecretReference;
  if (webhookIdReference) configuration.webhookIdReference = webhookIdReference;
  if (webhookId) configuration.webhookId = webhookId;
  if (successUrl) configuration.successUrl = successUrl;
  if (cancelUrl) configuration.cancelUrl = cancelUrl;

  return configuration;
}

function toAdminPaymentProviderConfiguration(value: unknown): AdminPaymentProviderConfiguration {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    webhookSecretReference: readString(record.webhookSecretReference),
    webhookIdReference: readString(record.webhookIdReference),
    webhookId: readString(record.webhookId),
    successUrl: readString(record.successUrl),
    cancelUrl: readString(record.cancelUrl),
  };
}

function toAdminPaymentWebhookEvent(event: {
  readonly id: string;
  readonly providerCode: string;
  readonly providerEventId: string;
  readonly eventType: string;
  readonly paymentReference: string | null;
  readonly processingStatus: AdminPaymentWebhookEvent["processingStatus"];
  readonly verificationStatus: AdminPaymentWebhookEvent["verificationStatus"];
  readonly payloadJson: unknown;
  readonly receivedAt: Date;
  readonly processedAt: Date | null;
}): AdminPaymentWebhookEvent {
  const processing = readWebhookProcessingMetadata(event.payloadJson);
  return {
    id: event.id,
    providerCode: event.providerCode,
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    paymentReference: event.paymentReference,
    processingStatus: event.processingStatus,
    verificationStatus: event.verificationStatus,
    receivedAt: event.receivedAt.toISOString(),
    processedAt: event.processedAt?.toISOString() ?? null,
    matchedBy: processing.matchedBy,
    statusMutationApplied: processing.statusMutationApplied,
  };
}

function normaliseEnvReference(value: string | null | undefined): string | undefined {
  const trimmed = normalisePlainText(value);
  if (!trimmed) return undefined;
  return /^[A-Z][A-Z0-9_]{1,63}$/.test(trimmed) ? trimmed : undefined;
}

function normaliseInternalUrl(value: string | null | undefined): string | undefined {
  const trimmed = normalisePlainText(value);
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  return trimmed.length <= 200 ? trimmed : undefined;
}

function normalisePlainText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readWebhookProcessingMetadata(payload: unknown): {
  readonly matchedBy: string | null;
  readonly statusMutationApplied: boolean;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { matchedBy: null, statusMutationApplied: false };
  }
  const processing = (payload as { yhpProcessing?: unknown }).yhpProcessing;
  if (!processing || typeof processing !== "object" || Array.isArray(processing)) {
    return { matchedBy: null, statusMutationApplied: false };
  }
  const record = processing as { matchedBy?: unknown; statusMutationApplied?: unknown };
  return {
    matchedBy: typeof record.matchedBy === "string" ? record.matchedBy : null,
    statusMutationApplied: record.statusMutationApplied === true,
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
