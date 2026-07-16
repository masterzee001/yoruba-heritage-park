import { createServerFn } from "@tanstack/react-start";

import type { AdminBooking, BookingFilters, PaymentStatus } from "./types";

interface BookingListInput {
  readonly search?: string;
  readonly status?: AdminBooking["status"] | "all";
  readonly source?: AdminBooking["source"] | "all";
}

type BookingWorkflowAction = "confirm" | "cancel" | "complete";

interface BookingWorkflowInput {
  readonly id?: string;
  readonly action?: BookingWorkflowAction;
  readonly internalNotes?: string;
}

interface BookingNotesInput {
  readonly id?: string;
  readonly internalNotes?: string;
}

interface BookingPaymentHistoryInput {
  readonly bookingId?: string;
}

export interface AdminBookingPaymentHistoryPayment {
  readonly id: string;
  readonly reference: string;
  readonly providerCode: string;
  readonly providerTransactionReference: string | null;
  readonly amountMinor: number;
  readonly amountDisplay: string;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly verificationStatus:
    | "unverified"
    | "review_required"
    | "preview_verified"
    | "not_applicable";
  readonly refundStatus: "none" | "review_requested" | "preview_pending" | "preview_refunded";
  readonly checkoutUrl: string | null;
  readonly providerOrderId: string | null;
  readonly sandbox: boolean;
  readonly reconciliationApplied: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminBookingPaymentHistoryWebhookEvent {
  readonly id: string;
  readonly providerCode: string;
  readonly providerEventId: string;
  readonly eventType: string;
  readonly paymentReference: string | null;
  readonly processingStatus: "received" | "ignored" | "review_required" | "processed" | "failed";
  readonly verificationStatus: "unverified" | "verified" | "failed" | "not_applicable";
  readonly statusMutationApplied: boolean;
  readonly receivedAt: string;
  readonly processedAt: string | null;
}

export interface AdminBookingPaymentHistory {
  readonly ok: boolean;
  readonly message?: string;
  readonly bookingId?: string;
  readonly payments: AdminBookingPaymentHistoryPayment[];
  readonly webhookEvents: AdminBookingPaymentHistoryWebhookEvent[];
}

export const listAdminBookings = createServerFn({ method: "GET" })
  .validator((data: BookingListInput = {}) => data)
  .handler(async ({ data }) => {
    const { MysqlBookingsRepository } = await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    await requireAdminServerPermission("bookings.view");
    const bookings = await new MysqlBookingsRepository().list(100);
    return bookings.map(toAdminBooking).filter((booking) => matchesFilters(booking, data));
  });

export const updateAdminBookingWorkflow = createServerFn({ method: "POST" })
  .validator((data: BookingWorkflowInput) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "Booking id is required." };
    if (!data.action || !["confirm", "cancel", "complete"].includes(data.action)) {
      return { ok: false, message: "Booking action is required." };
    }

    const nextStatus = workflowStatusForAction(data.action);
    const { MysqlAuditLogRepository, MysqlBookingsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("bookings.manage");
    const repository = new MysqlBookingsRepository();
    const existing = await repository.findById(data.id);
    if (!existing || existing.deletedAt) return { ok: false, message: "Booking was not found." };

    const updated = await repository.updateWorkflow(data.id, {
      status: nextStatus,
      internalNotes: data.internalNotes,
    });
    if (!updated) return { ok: false, message: "Booking could not be updated." };

    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: `bookings.booking.${data.action}`,
      moduleCode: "bookings",
      recordType: "booking",
      recordId: data.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        reference: existing.reference,
        previousStatus: existing.status,
        nextStatus: updated.status,
        internalNotesChanged: data.internalNotes !== existing.internalNotes,
      },
    });

    return {
      ok: true,
      booking: toAdminBooking(updated),
      message: workflowMessageForAction(data.action),
    };
  });

export const saveAdminBookingNotes = createServerFn({ method: "POST" })
  .validator((data: BookingNotesInput) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "Booking id is required." };

    const { MysqlAuditLogRepository, MysqlBookingsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("bookings.manage");
    const repository = new MysqlBookingsRepository();
    const existing = await repository.findById(data.id);
    if (!existing || existing.deletedAt) return { ok: false, message: "Booking was not found." };

    const updated = await repository.updateWorkflow(data.id, {
      internalNotes: data.internalNotes ?? "",
    });
    if (!updated) return { ok: false, message: "Booking notes could not be saved." };

    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "bookings.booking.internal_notes.saved",
      moduleCode: "bookings",
      recordType: "booking",
      recordId: data.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        reference: existing.reference,
        previousStatus: existing.status,
        nextStatus: updated.status,
        hadPreviousNotes: Boolean(existing.internalNotes),
        hasCurrentNotes: Boolean(updated.internalNotes),
      },
    });

    return {
      ok: true,
      booking: toAdminBooking(updated),
      message: "Internal booking notes saved.",
    };
  });

export const getAdminBookingPaymentHistory = createServerFn({ method: "GET" })
  .validator((data: BookingPaymentHistoryInput = {}) => data)
  .handler(async ({ data }): Promise<AdminBookingPaymentHistory> => {
    if (!data.bookingId) {
      return { ok: false, message: "Booking id is required.", payments: [], webhookEvents: [] };
    }

    const { MysqlBookingsRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    await requireAdminServerPermission("bookings.view");

    const booking = await new MysqlBookingsRepository().findById(data.bookingId);
    if (!booking || booking.deletedAt) {
      return { ok: false, message: "Booking was not found.", payments: [], webhookEvents: [] };
    }

    const paymentsRepository = new MysqlPaymentsRepository();
    const payments = await paymentsRepository.listForBooking(booking.id);
    const paymentReferences = new Set(payments.map((payment) => payment.reference));
    const webhookEvents = paymentReferences.size
      ? (await paymentsRepository.listWebhookEvents(100)).filter(
          (event) => event.paymentReference && paymentReferences.has(event.paymentReference),
        )
      : [];

    return {
      ok: true,
      bookingId: booking.id,
      payments: payments.map(toAdminBookingPaymentHistoryPayment),
      webhookEvents: webhookEvents.map(toAdminBookingPaymentHistoryWebhookEvent),
    };
  });

export type AdminBookingListFilters = BookingFilters;

function toAdminBooking(booking: {
  readonly id: string;
  readonly reference: string;
  readonly visitorName: string;
  readonly visitorEmail: string;
  readonly countryOfOrigin: string | null;
  readonly bookingType: string;
  readonly visitDate: Date;
  readonly durationOfStayDays: number | null;
  readonly guests: number;
  readonly amountMinor: number;
  readonly currency: string;
  readonly paymentState: AdminBooking["paymentState"];
  readonly status: AdminBooking["status"];
  readonly checkedInAt: Date | null;
  readonly source: AdminBooking["source"];
  readonly notes: string | null;
  readonly internalNotes: string | null;
  readonly createdAt: Date;
}): AdminBooking {
  return {
    id: booking.id,
    reference: booking.reference,
    visitorName: booking.visitorName,
    visitorEmail: booking.visitorEmail,
    countryOfOrigin: booking.countryOfOrigin ?? undefined,
    bookingType: booking.bookingType,
    visitDate: formatDate(booking.visitDate),
    durationOfStayDays: booking.durationOfStayDays ?? undefined,
    guests: booking.guests,
    amountNgn: booking.amountMinor / 100,
    currency: booking.currency,
    paymentState: booking.paymentState,
    status: booking.status,
    checkedIn: Boolean(booking.checkedInAt),
    source: booking.source,
    notes: booking.notes ?? undefined,
    internalNotes: booking.internalNotes ?? undefined,
    createdAt: formatDateTime(booking.createdAt),
    isDemo: false,
  };
}

function matchesFilters(booking: AdminBooking, filters: BookingListInput): boolean {
  const search = filters.search?.trim().toLowerCase();
  const matchesSearch =
    !search ||
    [
      booking.reference,
      booking.visitorName,
      booking.visitorEmail,
      booking.bookingType,
      booking.notes,
      booking.internalNotes,
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(search));
  const matchesStatus =
    !filters.status || filters.status === "all" || booking.status === filters.status;
  const matchesSource =
    !filters.source || filters.source === "all" || booking.source === filters.source;
  return Boolean(matchesSearch && matchesStatus && matchesSource);
}

function workflowStatusForAction(action: BookingWorkflowAction): AdminBooking["status"] {
  if (action === "confirm") return "confirmed";
  if (action === "cancel") return "cancelled";
  return "completed";
}

function workflowMessageForAction(action: BookingWorkflowAction): string {
  if (action === "confirm") return "Booking confirmed.";
  if (action === "cancel") return "Booking cancelled.";
  return "Booking marked completed.";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function toAdminBookingPaymentHistoryPayment(payment: {
  readonly id: string;
  readonly reference: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly providerCode: string;
  readonly providerTransactionReference: string | null;
  readonly status: PaymentStatus;
  readonly verificationStatus: AdminBookingPaymentHistoryPayment["verificationStatus"];
  readonly refundStatus: AdminBookingPaymentHistoryPayment["refundStatus"];
  readonly metadataJson: unknown;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): AdminBookingPaymentHistoryPayment {
  const checkout = readCheckoutMetadata(payment.metadataJson);
  return {
    id: payment.id,
    reference: payment.reference,
    providerCode: payment.providerCode,
    providerTransactionReference: payment.providerTransactionReference,
    amountMinor: payment.amountMinor,
    amountDisplay: formatMinorAmount(payment.amountMinor, payment.currency),
    currency: payment.currency,
    status: payment.status,
    verificationStatus: payment.verificationStatus,
    refundStatus: payment.refundStatus,
    checkoutUrl: checkout.checkoutUrl,
    providerOrderId: checkout.providerOrderId,
    sandbox: checkout.sandbox,
    reconciliationApplied: readReconciliationApplied(payment.metadataJson),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

function toAdminBookingPaymentHistoryWebhookEvent(event: {
  readonly id: string;
  readonly providerCode: string;
  readonly providerEventId: string;
  readonly eventType: string;
  readonly paymentReference: string | null;
  readonly processingStatus: AdminBookingPaymentHistoryWebhookEvent["processingStatus"];
  readonly verificationStatus: AdminBookingPaymentHistoryWebhookEvent["verificationStatus"];
  readonly payloadJson: unknown;
  readonly receivedAt: Date;
  readonly processedAt: Date | null;
}): AdminBookingPaymentHistoryWebhookEvent {
  return {
    id: event.id,
    providerCode: event.providerCode,
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    paymentReference: event.paymentReference,
    processingStatus: event.processingStatus,
    verificationStatus: event.verificationStatus,
    statusMutationApplied: readWebhookStatusMutationApplied(event.payloadJson),
    receivedAt: event.receivedAt.toISOString(),
    processedAt: event.processedAt?.toISOString() ?? null,
  };
}

function readCheckoutMetadata(metadata: unknown): {
  readonly checkoutUrl: string | null;
  readonly providerOrderId: string | null;
  readonly sandbox: boolean;
} {
  const checkout = readNestedRecord(metadata, "checkout");
  return {
    checkoutUrl: readString(checkout?.checkoutUrl),
    providerOrderId: readString(checkout?.providerOrderId),
    sandbox: checkout?.sandbox === true,
  };
}

function readReconciliationApplied(metadata: unknown): boolean {
  return Boolean(readNestedRecord(metadata, "reconciliation")?.webhookEventId);
}

function readWebhookStatusMutationApplied(payload: unknown): boolean {
  return readNestedRecord(payload, "yhpProcessing")?.statusMutationApplied === true;
}

function readNestedRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const nested = (value as Record<string, unknown>)[key];
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatMinorAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}
