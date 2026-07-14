/**
 * Typed service interfaces for the administrator portal.
 *
 * These interfaces are the ONLY contract route components should depend on.
 * `mock-admin-service.ts` provides an in-memory implementation for the
 * preview build. A MySQL-backed implementation can be supplied later
 * without changing route components.
 */

import type {
  AdminAppointment,
  AdminBooking,
  AdminEnquiry,
  AdminEvent,
  AdminExperience,
  AdminPayment,
  AdminSosAlert,
  AdminTicket,
  AdminUser,
  AppointmentFilters,
  BookingFilters,
  CalendarFilters,
  ContentPage,
  ContentFilters,
  EnquiryFilters,
  EventFilters,
  ExperienceFilters,
  TicketFilters,
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
  listPages(filters?: ContentFilters): Promise<ContentPage[]>;
  getPage(id: string): Promise<ContentPage | null>;
}

export interface ExperienceService {
  list(filters?: ExperienceFilters): Promise<AdminExperience[]>;
  get(id: string): Promise<AdminExperience | null>;
}

export interface EventService {
  list(filters?: EventFilters): Promise<AdminEvent[]>;
  calendar(filters?: CalendarFilters): Promise<AdminEvent[]>;
  get(id: string): Promise<AdminEvent | null>;
}

export interface BookingService {
  list(filters?: BookingFilters): Promise<AdminBooking[]>;
  get(id: string): Promise<AdminBooking | null>;
}

export interface TicketService {
  list(filters?: TicketFilters): Promise<AdminTicket[]>;
  get(id: string): Promise<AdminTicket | null>;
}

export interface EnquiryService {
  list(filters?: EnquiryFilters): Promise<AdminEnquiry[]>;
  get(id: string): Promise<AdminEnquiry | null>;
}

export interface AppointmentService {
  list(filters?: AppointmentFilters): Promise<AdminAppointment[]>;
  get(id: string): Promise<AdminAppointment | null>;
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
  appointments: AppointmentService;
  payments: PaymentService;
  sos: SosService;
  users: UserService;
}
