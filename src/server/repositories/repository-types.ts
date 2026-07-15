export type AccountStatus = "invited" | "active" | "suspended" | "disabled" | "archived";
export type AuditOutcome = "success" | "denied" | "failed" | "informational";

export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly accountStatus: AccountStatus;
  readonly emailVerifiedAt: Date | null;
  readonly lastLoginAt: Date | null;
  readonly failedLoginCount: number;
  readonly lockedUntil: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly archivedAt: Date | null;
}

export interface RoleRecord {
  readonly id: string;
  readonly roleCode: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly isSystemRole: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PermissionRecord {
  readonly id: string;
  readonly permissionCode: string;
  readonly moduleCode: string;
  readonly actionCode: string;
  readonly description: string | null;
  readonly createdAt: Date;
}

export interface AppSettingRecord {
  readonly id: string;
  readonly settingGroup: string;
  readonly settingKey: string;
  readonly valueJson: unknown;
  readonly isPublic: boolean;
  readonly updatedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AuditLogRecord {
  readonly id: string;
  readonly actorUserId: string | null;
  readonly actionCode: string;
  readonly moduleCode: string;
  readonly recordType: string | null;
  readonly recordId: string | null;
  readonly outcome: AuditOutcome;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadataJson: unknown;
  readonly createdAt: Date;
}

export interface CreateAuditLogInput {
  readonly actorUserId?: string | null;
  readonly actionCode: string;
  readonly moduleCode: string;
  readonly recordType?: string | null;
  readonly recordId?: string | null;
  readonly outcome: AuditOutcome;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly metadataJson?: unknown;
}
