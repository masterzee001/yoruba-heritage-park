import type { DemoRecord } from "./admin";

export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "refund_requested"
  | "refunded";

export type BookingSource = "website" | "phone" | "walk_in" | "partner";

export interface AdminBooking extends DemoRecord {
  id: string;
  reference: string;
  visitorName: string;
  visitorEmail: string;
  countryOfOrigin?: string;
  bookingType: string;
  visitDate: string;
  durationOfStayDays?: number;
  guests: number;
  amountNgn: number;
  paymentState: "unpaid" | "pending" | "paid" | "refunded" | "not_applicable";
  status: BookingStatus;
  checkedIn: boolean;
  source: BookingSource;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
}

export interface BookingFilters {
  search?: string;
  status?: BookingStatus | "all";
  source?: BookingSource | "all";
}

export interface AdminTicket extends DemoRecord {
  id: string;
  reference: string;
  bookingReference: string;
  holderName: string;
  ticketType: string;
  visitDate: string;
  qrStatus: "not_generated" | "issued" | "voided";
  checkInStatus: "pending" | "checked_in" | "no_show";
  checkedInAt?: string;
  assignedStaff?: string;
}

export interface TicketFilters {
  search?: string;
  qrStatus?: AdminTicket["qrStatus"] | "all";
  checkInStatus?: AdminTicket["checkInStatus"] | "all";
}
