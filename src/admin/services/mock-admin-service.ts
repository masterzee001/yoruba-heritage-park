/**
 * In-memory implementation of the AdminService contract.
 *
 * This module is the ONLY place that reads raw mock arrays. Route components
 * import `adminService` and call typed methods. When Codex wires MySQL,
 * this file is replaced with a repository-backed implementation and route
 * components remain unchanged.
 */

import { mockBookings, mockTickets } from "../mock/bookings";
import { mockContentPages } from "../mock/content";
import { mockEnquiries } from "../mock/enquiries";
import { mockEvents, mockExperiences } from "../mock/events";
import { mockPayments } from "../mock/payments";
import { mockSosAlerts } from "../mock/sos";
import { mockAdminUsers } from "../mock/users";
import type { AdminService, DashboardSummary } from "./admin-service";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const later = <T>(value: T): Promise<T> =>
  new Promise((resolve) => resolve(clone(value)));

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
  content: { async listPages() { return later(mockContentPages); } },
  experiences: { async list() { return later(mockExperiences); } },
  events: { async list() { return later(mockEvents); } },
  bookings: {
    async list() { return later(mockBookings); },
    async get(id: string) {
      return later(mockBookings.find((b) => b.id === id) ?? null);
    },
  },
  tickets: { async list() { return later(mockTickets); } },
  enquiries: { async list() { return later(mockEnquiries); } },
  payments: { async list() { return later(mockPayments); } },
  sos: {
    async list() { return later(mockSosAlerts); },
    async get(id: string) {
      return later(mockSosAlerts.find((a) => a.id === id) ?? null);
    },
  },
  users: { async list() { return later(mockAdminUsers); } },
};

export const adminService: AdminService = mockAdminService;
