/**
 * Shared admin primitives used across modules.
 *
 * Every operational record type in this folder extends `DemoRecord` so that
 * demonstration data is impossible to confuse with production records.
 */

export interface DemoRecord {
  /** Must be true for every mock operational record shown in the portal. */
  readonly isDemo: true;
}

export type AdminRole =
  | "super_admin"
  | "content_manager"
  | "booking_officer"
  | "safety_officer"
  | "viewer";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Administrator",
  content_manager: "Content Manager",
  booking_officer: "Booking Officer",
  safety_officer: "Safety Officer",
  viewer: "Viewer / Auditor",
};

export interface AdminOperator {
  id: string;
  name: string;
  initials: string;
  role: AdminRole;
}

/** Generic status tone used by badges across modules. */
export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "preview";

export interface StatusDescriptor {
  label: string;
  tone: StatusTone;
}
