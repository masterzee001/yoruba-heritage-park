/**
 * Typed service interfaces for the administrator portal.
 *
 * These interfaces are the ONLY contract route components should depend on.
 * `mock-admin-service.ts` provides an in-memory implementation for the
 * preview build. Codex will supply a MySQL-backed implementation later
 * without changing route components.
 */

import type {
  AdminBooking,
  AdminEnquiry,
  AdminEvent,
  AdminExperience,
  AdminPayment,
  AdminSosAlert,
  AdminTicket,
  AdminUser,
  ContentPage,
} from "../types";

export interface DashboardSummary {
  visitorsToday: number;
  upcomingBookings: number;
  pendingEnquiries: number;
  openSosAlerts: number;
  ticketRevenue7dNgn: number;
  pendingContent: number;
}

export interface ContentService {
  listPages(): Promise<ContentPage[]>;
}

export interface ExperienceService {
  list(): Promise<AdminExperience[]>;
}

export interface EventService {
  list(): Promise<AdminEvent[]>;
}

export interface BookingService {
  list(): Promise<AdminBooking[]>;
  get(id: string): Promise<AdminBooking | null>;
}

export interface TicketService {
  list(): Promise<AdminTicket[]>;
}

export interface EnquiryService {
  list(): Promise<AdminEnquiry[]>;
}

export interface PaymentService {
  list(): Promise<AdminPayment[]>;
}

export interface SosService {
  list(): Promise<AdminSosAlert[]>;
  get(id: string): Promise<AdminSosAlert | null>;
}

export interface UserService {
  list(): Promise<AdminUser[]>;
}

export interface DashboardService {
  summary(): Promise<DashboardSummary>;
}

export interface AdminService {
  dashboard: DashboardService;
  content: ContentService;
  experiences: ExperienceService;
  events: EventService;
  bookings: BookingService;
  tickets: TicketService;
  enquiries: EnquiryService;
  payments: PaymentService;
  sos: SosService;
  users: UserService;
}
