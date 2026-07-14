import type { AdminRole, DemoRecord } from "./admin";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "publish"
  | "archive"
  | "export_preview"
  | "assign"
  | "acknowledge"
  | "resolve"
  | "manage_users"
  | "manage_settings"
  | "view_audit_logs";

export type PermissionArea =
  | "dashboard"
  | "content"
  | "experiences"
  | "events"
  | "bookings"
  | "tickets"
  | "payments"
  | "enquiries"
  | "appointments"
  | "learning"
  | "oriki"
  | "ceremonies"
  | "stay_own"
  | "media"
  | "sos"
  | "incidents"
  | "users"
  | "roles"
  | "settings"
  | "audit_logs";

export interface AdminRoleDefinition extends DemoRecord {
  id: AdminRole;
  label: string;
  description: string;
  assignedUserCount: number;
  readOnly: true;
  permissions: Partial<Record<PermissionArea, PermissionAction[]>>;
}

export type AuditOutcome =
  | "successful_preview"
  | "denied_preview"
  | "failed_preview"
  | "informational";

export interface AdminAuditLog extends DemoRecord {
  id: string;
  reference: string;
  occurredAt: string;
  userPlaceholder: string;
  action: string;
  module: PermissionArea;
  recordReference: string;
  outcome: AuditOutcome;
  ipPlaceholder: string;
  devicePlaceholder: string;
  details: string;
}

export interface AuditLogFilters {
  search?: string;
  user?: string;
  module?: PermissionArea | "all";
  action?: string;
  outcome?: AuditOutcome | "all";
  date?: string;
}

export interface AdminSettingsSnapshot extends DemoRecord {
  id: string;
  general: Record<string, string>;
  visitorInformation: Record<string, string>;
  booking: Record<string, string>;
  payments: Record<string, string>;
  notifications: Record<string, string>;
  safety: Record<string, string>;
  media: Record<string, string>;
  seo: Record<string, string>;
  legalPrivacy: Record<string, string>;
}
