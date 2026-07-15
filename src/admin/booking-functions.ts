import { createServerFn } from "@tanstack/react-start";

import type { AdminBooking, BookingFilters } from "./types";

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
