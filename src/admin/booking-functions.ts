import { createServerFn } from "@tanstack/react-start";

import type { AdminBooking, BookingFilters } from "./types";

interface BookingListInput {
  readonly search?: string;
  readonly status?: AdminBooking["status"] | "all";
  readonly source?: AdminBooking["source"] | "all";
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
  readonly paymentState: AdminBooking["paymentState"];
  readonly status: AdminBooking["status"];
  readonly checkedInAt: Date | null;
  readonly source: AdminBooking["source"];
  readonly notes: string | null;
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
    paymentState: booking.paymentState,
    status: booking.status,
    checkedIn: Boolean(booking.checkedInAt),
    source: booking.source,
    notes: booking.notes ?? undefined,
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
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(search));
  const matchesStatus =
    !filters.status || filters.status === "all" || booking.status === filters.status;
  const matchesSource =
    !filters.source || filters.source === "all" || booking.source === filters.source;
  return Boolean(matchesSearch && matchesStatus && matchesSource);
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
