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
  AdminCeremonyEnquiry,
  AdminEnquiry,
  AdminEvent,
  AdminExperience,
  AdminLearningResource,
  AdminMediaAsset,
  AdminOrikiRequest,
  AdminPayment,
  AdminSosAlert,
  AdminStayOwnEnquiry,
  AdminTicket,
  AdminUser,
  AppointmentFilters,
  BookingFilters,
  CalendarFilters,
  CeremonyFilters,
  ContentPage,
  ContentFilters,
  EnquiryFilters,
  EventFilters,
  ExperienceFilters,
  LearningFilters,
  MediaFilters,
  OrikiFilters,
  PaymentFilters,
  StayOwnFilters,
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
  list(filters?: PaymentFilters): Promise<AdminPayment[]>;
  get(id: string): Promise<AdminPayment | null>;
}

export interface LearningService {
  list(filters?: LearningFilters): Promise<AdminLearningResource[]>;
  get(id: string): Promise<AdminLearningResource | null>;
}

export interface OrikiService {
  list(filters?: OrikiFilters): Promise<AdminOrikiRequest[]>;
  get(id: string): Promise<AdminOrikiRequest | null>;
}

export interface CeremonyService {
  list(filters?: CeremonyFilters): Promise<AdminCeremonyEnquiry[]>;
  get(id: string): Promise<AdminCeremonyEnquiry | null>;
}

export interface StayOwnService {
  list(filters?: StayOwnFilters): Promise<AdminStayOwnEnquiry[]>;
  get(id: string): Promise<AdminStayOwnEnquiry | null>;
}

export interface MediaService {
  list(filters?: MediaFilters): Promise<AdminMediaAsset[]>;
  get(id: string): Promise<AdminMediaAsset | null>;
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
  learning: LearningService;
  oriki: OrikiService;
  ceremonies: CeremonyService;
  stayOwn: StayOwnService;
  media: MediaService;
  sos: SosService;
  users: UserService;
}
