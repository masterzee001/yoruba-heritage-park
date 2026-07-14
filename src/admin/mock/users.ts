import type { AdminUser } from "../types";

export const mockAdminUsers: AdminUser[] = [
  {
    isDemo: true,
    id: "u-001",
    name: "Sample Super Admin",
    email: "super.admin@example.test",
    role: "super_admin",
    status: "active",
    lastActiveAt: "2026-07-14T09:12:00Z",
  },
  {
    isDemo: true,
    id: "u-002",
    name: "Sample Content Manager",
    email: "content.manager@example.test",
    role: "content_manager",
    status: "active",
    lastActiveAt: "2026-07-13T18:01:00Z",
  },
  {
    isDemo: true,
    id: "u-003",
    name: "Sample Safety Officer",
    email: "safety.officer@example.test",
    role: "safety_officer",
    status: "invited",
    invitedAt: "2026-07-10T10:00:00Z",
  },
];
