/**
 * In-memory implementation of the AdminService contract.
 *
 * This module is the ONLY place that reads raw mock arrays. Route components
 * import `adminService` and call typed methods. When MySQL is wired,
 * this file is replaced with a repository-backed implementation and route
 * components remain unchanged.
 */

import { mockAppointments } from "../mock/appointments";
import { mockBookings, mockTickets } from "../mock/bookings";
import { mockContentPages } from "../mock/content";
import { mockEnquiries } from "../mock/enquiries";
import { mockEvents, mockExperiences } from "../mock/events";
import { mockPayments } from "../mock/payments";
import { mockSosAlerts } from "../mock/sos";
import { mockAdminUsers } from "../mock/users";
import type {
  AdminAppointment,
  AdminBooking,
  AdminEnquiry,
  AdminEvent,
  AdminExperience,
  AdminTicket,
  AppointmentFilters,
  BookingFilters,
  CalendarFilters,
  ContentFilters,
  ContentPage,
  EnquiryFilters,
  EventFilters,
  ExperienceFilters,
  TicketFilters,
} from "../types";
import type { AdminService, DashboardSummary } from "./admin-service";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const later = <T>(value: T): Promise<T> => new Promise((resolve) => resolve(clone(value)));

const includes = (value: string | undefined, search = "") =>
  value?.toLowerCase().includes(search.trim().toLowerCase()) ?? false;

const matchesSearch = (fields: Array<string | undefined>, search?: string) =>
  !search?.trim() || fields.some((field) => includes(field, search));

const matchesValue = <T extends string>(value: T, filter?: T | "all") =>
  !filter || filter === "all" || value === filter;

const filterContent = (rows: ContentPage[], filters?: ContentFilters) =>
  rows.filter(
    (row) =>
      matchesSearch([row.title, row.slug, row.summary, row.owner], filters?.search) &&
      matchesValue(row.status, filters?.status) &&
      matchesValue(row.section, filters?.section),
  );

const filterExperiences = (rows: AdminExperience[], filters?: ExperienceFilters) =>
  rows.filter(
    (row) =>
      matchesSearch([row.title, row.category, row.summary], filters?.search) &&
      matchesValue(row.status, filters?.status) &&
      matchesValue(row.bookingType, filters?.bookingType),
  );

const filterEvents = (rows: AdminEvent[], filters?: EventFilters | CalendarFilters) => {
  const category = filters && "category" in filters ? filters.category : undefined;
  return rows.filter(
    (row) =>
      matchesSearch([row.title, row.category, row.notes], filters?.search) &&
      matchesValue(row.status, filters?.status) &&
      (!category || row.category === category),
  );
};

const filterBookings = (rows: AdminBooking[], filters?: BookingFilters) =>
  rows.filter(
    (row) =>
      matchesSearch(
        [row.reference, row.visitorName, row.visitorEmail, row.bookingType, row.notes],
        filters?.search,
      ) &&
      matchesValue(row.status, filters?.status) &&
      matchesValue(row.source, filters?.source),
  );

const filterTickets = (rows: AdminTicket[], filters?: TicketFilters) =>
  rows.filter(
    (row) =>
      matchesSearch(
        [row.reference, row.bookingReference, row.holderName, row.ticketType],
        filters?.search,
      ) &&
      matchesValue(row.qrStatus, filters?.qrStatus) &&
      matchesValue(row.checkInStatus, filters?.checkInStatus),
  );

const filterEnquiries = (rows: AdminEnquiry[], filters?: EnquiryFilters) =>
  rows.filter(
    (row) =>
      matchesSearch(
        [row.reference, row.contactName, row.contactEmail, row.message, row.assignedTo],
        filters?.search,
      ) &&
      matchesValue(row.status, filters?.status) &&
      matchesValue(row.category, filters?.category),
  );

const filterAppointments = (rows: AdminAppointment[], filters?: AppointmentFilters) =>
  rows.filter(
    (row) =>
      matchesSearch(
        [row.reference, row.visitorName, row.visitorEmail, row.notes, row.assignedTo],
        filters?.search,
      ) &&
      matchesValue(row.status, filters?.status) &&
      matchesValue(row.category, filters?.category),
  );

export const mockAdminService: AdminService = {
  dashboard: {
    async summary(): Promise<DashboardSummary> {
      return later({
        visitorsToday: 0,
        upcomingBookings: mockBookings.filter(
          (b) => b.status === "confirmed" || b.status === "pending",
        ).length,
        pendingEnquiries: mockEnquiries.filter((e) => e.status === "new").length,
        openSosAlerts: mockSosAlerts.filter(
          (s) => s.status === "new" || s.status === "acknowledged" || s.status === "responding",
        ).length,
        ticketRevenue7dNgn: 0,
        pendingContent: mockContentPages.filter(
          (p) => p.status === "draft" || p.status === "in_review",
        ).length,
      });
    },
  },
  content: {
    async listPages(filters) {
      return later(filterContent(mockContentPages, filters));
    },
    async getPage(id: string) {
      return later(mockContentPages.find((p) => p.id === id) ?? null);
    },
  },
  experiences: {
    async list(filters) {
      return later(filterExperiences(mockExperiences, filters));
    },
    async get(id: string) {
      return later(mockExperiences.find((x) => x.id === id) ?? null);
    },
  },
  events: {
    async list(filters) {
      return later(filterEvents(mockEvents, filters));
    },
    async calendar(filters) {
      return later(
        filterEvents(mockEvents, filters).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      );
    },
    async get(id: string) {
      return later(mockEvents.find((e) => e.id === id) ?? null);
    },
  },
  bookings: {
    async list(filters) {
      return later(filterBookings(mockBookings, filters));
    },
    async get(id: string) {
      return later(mockBookings.find((b) => b.id === id) ?? null);
    },
  },
  tickets: {
    async list(filters) {
      return later(filterTickets(mockTickets, filters));
    },
    async get(id: string) {
      return later(mockTickets.find((t) => t.id === id) ?? null);
    },
  },
  enquiries: {
    async list(filters) {
      return later(filterEnquiries(mockEnquiries, filters));
    },
    async get(id: string) {
      return later(mockEnquiries.find((e) => e.id === id) ?? null);
    },
  },
  appointments: {
    async list(filters) {
      return later(filterAppointments(mockAppointments, filters));
    },
    async get(id: string) {
      return later(mockAppointments.find((a) => a.id === id) ?? null);
    },
  },
  payments: {
    async list() {
      return later(mockPayments);
    },
  },
  sos: {
    async list() {
      return later(mockSosAlerts);
    },
    async get(id: string) {
      return later(mockSosAlerts.find((a) => a.id === id) ?? null);
    },
  },
  users: {
    async list() {
      return later(mockAdminUsers);
    },
  },
};

export const adminService: AdminService = mockAdminService;
