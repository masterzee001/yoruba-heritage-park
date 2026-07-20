import type { AdminAuditLog, AdminRoleDefinition, AdminSettingsSnapshot } from "../types";

export const mockRoleDefinitions: AdminRoleDefinition[] = [
  {
    isDemo: true,
    id: "super_admin",
    label: "Super Administrator",
    description:
      "Preview role for full administrative visibility. Real authority is server-side only.",
    assignedUserCount: 1,
    readOnly: true,
    permissions: {
      dashboard: ["view"],
      content: ["view", "create", "edit", "publish", "archive"],
      payments: ["view", "export_preview"],
      users: ["view", "manage_users"],
      roles: ["view", "edit"],
      settings: ["view", "manage_settings"],
      audit_logs: ["view", "view_audit_logs", "export_preview"],
    },
  },
  {
    isDemo: true,
    id: "content_manager",
    label: "Content Manager",
    description: "Preview role for public content and media workflows.",
    assignedUserCount: 1,
    readOnly: true,
    permissions: {
      dashboard: ["view"],
      content: ["view", "create", "edit", "publish", "archive"],
      learning: ["view", "create", "edit", "publish"],
      media: ["view", "create", "edit", "archive"],
    },
  },
  {
    isDemo: true,
    id: "booking_officer",
    label: "Booking Officer",
    description: "Preview role for bookings, tickets, enquiries and appointments.",
    assignedUserCount: 0,
    readOnly: true,
    permissions: {
      dashboard: ["view"],
      bookings: ["view", "create", "edit"],
      tickets: ["view", "edit"],
      enquiries: ["view", "assign", "edit"],
      appointments: ["view", "create", "edit"],
    },
  },
  {
    isDemo: true,
    id: "viewer",
    label: "Viewer / Auditor",
    description: "Preview read-only role for oversight.",
    assignedUserCount: 0,
    readOnly: true,
    permissions: {
      dashboard: ["view"],
      audit_logs: ["view", "view_audit_logs"],
    },
  },
];

export const mockAuditLogs: AdminAuditLog[] = [
  {
    isDemo: true,
    id: "al-001",
    reference: "YHP-AUD-DEMO-0001",
    occurredAt: "2026-07-14T09:30:00Z",
    occurredDate: "2026-07-14",
    userPlaceholder: "Fallback Super Administrator",
    action: "Viewed preview dashboard",
    module: "dashboard",
    recordReference: "Preview session",
    outcome: "informational",
    ipPlaceholder: "192.0.2.xxx",
    devicePlaceholder: "Preview browser",
    details: "Fallback audit event. Production audit logging is not connected.",
  },
  {
    isDemo: true,
    id: "al-003",
    reference: "YHP-AUD-DEMO-0003",
    occurredAt: "2026-07-13T16:20:00Z",
    occurredDate: "2026-07-13",
    userPlaceholder: "Fallback Content Manager",
    action: "Preview publish blocked",
    module: "content",
    recordReference: "YHP-CONTENT-DEMO",
    outcome: "denied_preview",
    ipPlaceholder: "192.0.2.xxx",
    devicePlaceholder: "Preview browser",
    details: "Production publishing is not connected.",
  },
];

export const mockSettingsSnapshot: AdminSettingsSnapshot = {
  isDemo: true,
  id: "settings-preview",
  general: {
    "Park name": "Yorùbá Heritage Park",
    "Operational status": "Pending operational confirmation",
  },
  visitorInformation: {
    "Opening information": "Awaiting authorised content",
    "Visitor guidance": "Pending operational confirmation",
  },
  booking: {
    "Booking mode": "Preview only",
    Availability: "Pending operational confirmation",
  },
  payments: {
    "Payment provider": "Not connected",
    "Refund policy": "Awaiting authorised content",
  },
  notifications: {
    Email: "Disabled",
    SMS: "Disabled",
    WhatsApp: "Disabled",
  },
  safety: {},
  media: {
    "Upload mode": "Disabled",
    "Storage provider": "Not connected",
  },
  seo: {
    "Meta review": "Pending operational confirmation",
  },
  legalPrivacy: {
    "Legal terms": "Awaiting authorised content",
    "Privacy information": "Awaiting authorised content",
  },
};
