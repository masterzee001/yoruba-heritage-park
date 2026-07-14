import type { AdminRole, DemoRecord } from "./admin";

export type AdminUserStatus = "active" | "invited" | "suspended";
export type AdminInvitationState =
  | "not_sent"
  | "invitation_preview"
  | "accepted_preview"
  | "expired_preview";

export interface AdminUser extends DemoRecord {
  id: string;
  reference: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  invitationState: AdminInvitationState;
  readOnly: boolean;
  suspensionState: "none" | "suspended_preview" | "restore_available_preview";
  createdAt: string;
  lastActiveAt?: string;
  invitedAt?: string;
}

export interface AdminUserFilters {
  search?: string;
  role?: AdminRole | "all";
  status?: AdminUserStatus | "all";
  invitationState?: AdminInvitationState | "all";
}
