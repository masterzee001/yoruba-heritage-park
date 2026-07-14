import type { AdminRole, DemoRecord } from "./admin";

export type AdminUserStatus = "active" | "invited" | "suspended";

export interface AdminUser extends DemoRecord {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  lastActiveAt?: string;
  invitedAt?: string;
}
