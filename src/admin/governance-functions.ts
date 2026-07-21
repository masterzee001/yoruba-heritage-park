import { createServerFn } from "@tanstack/react-start";

import { projectStatus } from "@/config/project-status";

import type {
  AdminRole,
  AdminRoleDefinition,
  AdminSettingsSnapshot,
  AdminUser,
  AdminUserFilters,
  PermissionAction,
  PermissionArea,
} from "./types";

interface SaveAdminUserInput {
  readonly id?: string | null;
  readonly name?: string;
  readonly email?: string;
  readonly role?: AdminRole;
  readonly status?: AdminUser["status"];
}

interface UpdateAdminUserStatusInput {
  readonly id?: string;
  readonly status?: AdminUser["status"];
}

interface SetAdminUserPasswordInput {
  readonly id?: string;
  readonly password?: string;
  readonly confirmPassword?: string;
}

interface SendAdminCredentialNoticeInput {
  readonly id?: string;
  readonly purpose?: "invitation" | "password_reset";
}

interface SendEmailDeliveryTestInput {
  readonly toEmail?: string;
}

interface SaveAdminSettingInput {
  readonly group?: string;
  readonly key?: string;
  readonly value?: string;
  readonly isPublic?: boolean;
}

const roleCodeToAdminRole: Record<string, AdminRole> = {
  super_administrator: "super_admin",
  content_manager: "content_manager",
  booking_officer: "booking_officer",
  safety_officer: "safety_officer",
  viewer_auditor: "viewer",
};

const adminRoleToRoleCode: Record<AdminRole, string> = {
  super_admin: "super_administrator",
  content_manager: "content_manager",
  booking_officer: "booking_officer",
  safety_officer: "safety_officer",
  viewer: "viewer_auditor",
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .validator((data: AdminUserFilters = {}) => data)
  .handler(async ({ data }) => {
    const { MysqlRolesRepository, MysqlUsersRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    await requireAdminServerPermission("users.manage");

    const usersRepository = new MysqlUsersRepository();
    const rolesRepository = new MysqlRolesRepository();
    const users = await usersRepository.list(100);
    const rows = await Promise.all(
      users.map(async (user) => {
        const roles = await rolesRepository.listRolesForUser(user.id);
        return toAdminUser(user, roles[0]?.roleCode);
      }),
    );
    return rows.filter((row) => matchesUserFilters(row, data));
  });

export const saveAdminUser = createServerFn({ method: "POST" })
  .validator((data: SaveAdminUserInput) => data)
  .handler(async ({ data }) => {
    const name = data.name?.trim();
    const email = data.email?.trim();
    const role = data.role ?? "viewer";
    const status = data.status ?? "invited";
    if (!name) return { ok: false, message: "Display name is required." };
    if (!email) return { ok: false, message: "Email address is required." };
    if (!adminRoleToRoleCode[role]) return { ok: false, message: "Role is required." };

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { MysqlAuditLogRepository, MysqlRolesRepository, MysqlUsersRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("users.manage");
    const usersRepository = new MysqlUsersRepository();
    const rolesRepository = new MysqlRolesRepository();

    const existing = data.id ? await usersRepository.findById(data.id) : null;
    const user = existing
      ? await usersRepository.update({
          userId: existing.id,
          displayName: name,
          accountStatus: status,
        })
      : await usersRepository.create({ email, displayName: name, accountStatus: status });
    if (!user) return { ok: false, message: "User record could not be saved." };

    await rolesRepository.setUserRoles(user.id, [adminRoleToRoleCode[role]], principal.userId);
    const roles = await rolesRepository.listRolesForUser(user.id);
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: existing ? "users.user.updated" : "users.user.created",
      moduleCode: "users",
      recordType: "user",
      recordId: user.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        email: user.email,
        roleCode: roles[0]?.roleCode ?? null,
        accountStatus: user.accountStatus,
      },
    });

    return {
      ok: true,
      message: "Administrator user saved.",
      user: toAdminUser(user, roles[0]?.roleCode),
    };
  });

export const updateAdminUserStatus = createServerFn({ method: "POST" })
  .validator((data: UpdateAdminUserStatusInput) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "User id is required." };
    if (!data.status) return { ok: false, message: "User status is required." };

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { MysqlAuditLogRepository, MysqlRolesRepository, MysqlUsersRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("users.manage");
    const usersRepository = new MysqlUsersRepository();
    const existing = await usersRepository.findById(data.id);
    if (!existing) return { ok: false, message: "User was not found." };
    if (existing.id === principal.userId && data.status !== "active") {
      return { ok: false, message: "You cannot suspend your own active administrator account." };
    }

    const updated = await usersRepository.update({ userId: data.id, accountStatus: data.status });
    if (!updated) return { ok: false, message: "User status could not be updated." };
    const roles = await new MysqlRolesRepository().listRolesForUser(updated.id);
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "users.user.status.updated",
      moduleCode: "users",
      recordType: "user",
      recordId: updated.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: { previousStatus: existing.accountStatus, nextStatus: updated.accountStatus },
    });
    return {
      ok: true,
      message: "Administrator status updated.",
      user: toAdminUser(updated, roles[0]?.roleCode),
    };
  });

export const setAdminUserPassword = createServerFn({ method: "POST" })
  .validator((data: SetAdminUserPasswordInput) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "User id is required." };
    const password = data.password ?? "";
    if (password !== data.confirmPassword) {
      return { ok: false, message: "Password confirmation does not match." };
    }

    const { getAuthConfig } = await import("../server/auth/auth-config");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { hashPassword } = await import("../server/auth/password");
    const { MysqlAuditLogRepository, MysqlSessionsRepository, MysqlUsersRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("users.manage");
    const config = getAuthConfig();

    if (password.length < config.passwordMinLength) {
      return {
        ok: false,
        message: `Password must be at least ${config.passwordMinLength} characters.`,
      };
    }

    const usersRepository = new MysqlUsersRepository();
    const user = await usersRepository.findById(data.id);
    if (!user || user.archivedAt) return { ok: false, message: "User was not found." };

    await usersRepository.setPasswordHash(user.id, await hashPassword(password));
    await new MysqlSessionsRepository().revokeAllForUser(user.id, "password_reset");
    const updated =
      user.accountStatus === "invited"
        ? await usersRepository.update({ userId: user.id, accountStatus: "active" })
        : user;

    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "users.user.password.set",
      moduleCode: "users",
      recordType: "user",
      recordId: user.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        email: user.email,
        selfReset: principal.userId === user.id,
        sessionsRevoked: true,
        activatedFromInvitation: user.accountStatus === "invited",
      },
    });

    return {
      ok: true,
      message: updated?.accountStatus === "active" ? "Password saved." : "Password reset saved.",
    };
  });

export const sendAdminCredentialNotice = createServerFn({ method: "POST" })
  .validator((data: SendAdminCredentialNoticeInput) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "User id is required." };
    if (data.purpose !== "invitation" && data.purpose !== "password_reset") {
      return { ok: false, message: "Credential notice purpose is required." };
    }

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { sendAdminCredentialNotice: sendNotice } =
      await import("../server/notifications/email-service");
    const { MysqlAuditLogRepository, MysqlUsersRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("users.manage");

    const user = await new MysqlUsersRepository().findById(data.id);
    if (!user || user.archivedAt) return { ok: false, message: "User was not found." };

    const delivery = await sendNotice({
      toEmail: user.email,
      displayName: user.displayName,
      purpose: data.purpose,
    });
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode:
        data.purpose === "invitation"
          ? "users.user.invitation_notice.sent"
          : "users.user.password_notice.sent",
      moduleCode: "users",
      recordType: "user",
      recordId: user.id,
      outcome: delivery.status === "sent" ? "success" : "informational",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        email: user.email,
        deliveryStatus: delivery.status,
        providerMessageId: delivery.providerMessageId ?? null,
      },
    });

    return {
      ok: delivery.status === "sent",
      message: delivery.message,
    };
  });

export const listAdminRoles = createServerFn({ method: "GET" }).handler(async () => {
  const { MysqlRolesRepository } = await import("../server/repositories/mysql");
  const { requireAdminServerPermission } = await import("./server-permissions");
  await requireAdminServerPermission("roles.manage");
  const repository = new MysqlRolesRepository();
  const roles = await repository.listRoles();
  const counts = await repository.countUsersByRole();
  const rows = await Promise.all(
    roles.map(async (role) =>
      toAdminRoleDefinition(
        role,
        await repository.listPermissionsForRole(role.roleCode),
        counts[role.roleCode] ?? 0,
      ),
    ),
  );
  return rows;
});

export const getAdminSettingsSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const { MysqlSettingsRepository } = await import("../server/repositories/mysql");
  const { inspectEmailDeliveryConfiguration } =
    await import("../server/notifications/email-service");
  const { requireAdminServerPermission } = await import("./server-permissions");
  await requireAdminServerPermission("settings.manage");
  const settings = await new MysqlSettingsRepository().listAll();
  return toSettingsSnapshot(settings, inspectEmailDeliveryConfiguration());
});

export const runEmailDeliveryTest = createServerFn({ method: "POST" })
  .validator((data: SendEmailDeliveryTestInput = {}) => data)
  .handler(async ({ data }) => {
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { sendEmailDeliveryTest, verifyEmailDeliveryTransport } =
      await import("../server/notifications/email-service");
    const { MysqlAuditLogRepository } = await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("settings.manage");

    const verification = await verifyEmailDeliveryTransport();
    if (!verification.ok) {
      return {
        ok: false,
        message: verification.message,
        diagnostics: verification.diagnostics,
      };
    }

    const delivery = await sendEmailDeliveryTest(data.toEmail);
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "settings.email_delivery.test_sent",
      moduleCode: "settings",
      recordType: "email_delivery",
      recordId: "smtp",
      outcome: delivery.status === "sent" ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        deliveryStatus: delivery.status,
        providerMessageId: delivery.providerMessageId ?? null,
        recipientProvided: Boolean(data.toEmail?.trim()),
      },
    });

    return {
      ok: delivery.status === "sent",
      message: delivery.message,
      diagnostics: verification.diagnostics,
    };
  });

export const saveAdminSetting = createServerFn({ method: "POST" })
  .validator((data: SaveAdminSettingInput) => data)
  .handler(async ({ data }) => {
    const group = data.group?.trim().toLowerCase();
    const key = data.key?.trim().toLowerCase();
    const value = data.value?.trim();
    if (!group || !/^[a-z0-9_-]+$/.test(group)) {
      return {
        ok: false,
        message: "Setting group must use lowercase letters, numbers, hyphens or underscores.",
      };
    }
    if (!key || !/^[a-z0-9_-]+$/.test(key)) {
      return {
        ok: false,
        message: "Setting key must use lowercase letters, numbers, hyphens or underscores.",
      };
    }
    if (!value) return { ok: false, message: "Setting value is required." };

    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { MysqlAuditLogRepository, MysqlSettingsRepository } =
      await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("settings.manage");
    const saved = await new MysqlSettingsRepository().upsert({
      settingGroup: group,
      settingKey: key,
      valueJson: value,
      isPublic: Boolean(data.isPublic),
      updatedByUserId: principal.userId,
    });
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "settings.setting.saved",
      moduleCode: "settings",
      recordType: "app_setting",
      recordId: saved.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: {
        settingGroup: saved.settingGroup,
        settingKey: saved.settingKey,
        isPublic: saved.isPublic,
      },
    });
    return { ok: true, message: "Setting saved." };
  });

function toAdminUser(
  user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string;
    readonly accountStatus: string;
    readonly createdAt: Date;
    readonly lastLoginAt: Date | null;
  },
  roleCode: string | undefined,
): AdminUser {
  const status = toAdminUserStatus(user.accountStatus);
  return {
    isDemo: false,
    id: user.id,
    reference: user.id,
    name: user.displayName,
    email: user.email,
    role: roleCodeToAdminRole[roleCode ?? ""] ?? "viewer",
    status,
    invitationState: status === "invited" ? "not_sent" : "accepted_preview",
    readOnly: false,
    suspensionState: status === "suspended" ? "restore_available_preview" : "none",
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastLoginAt?.toISOString() ?? "No login recorded",
  };
}

function toAdminUserStatus(status: string): AdminUser["status"] {
  if (status === "suspended" || status === "disabled") return "suspended";
  if (status === "invited") return "invited";
  return "active";
}

function matchesUserFilters(user: AdminUser, filters: AdminUserFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  return Boolean(
    (!search ||
      [user.reference, user.name, user.email].some((value) =>
        value.toLowerCase().includes(search),
      )) &&
    (!filters.role || filters.role === "all" || user.role === filters.role) &&
    (!filters.status || filters.status === "all" || user.status === filters.status),
  );
}

function toAdminRoleDefinition(
  role: {
    readonly roleCode: string;
    readonly displayName: string;
    readonly description: string | null;
    readonly isSystemRole: boolean;
  },
  permissions: Array<{
    readonly permissionCode: string;
    readonly moduleCode: string;
    readonly actionCode: string;
  }>,
  assignedUserCount: number,
): AdminRoleDefinition {
  return {
    isDemo: false,
    id: roleCodeToAdminRole[role.roleCode] ?? "viewer",
    label: role.displayName,
    description: role.description ?? "No description recorded.",
    assignedUserCount,
    readOnly: true,
    permissions: permissions.reduce<Partial<Record<PermissionArea, PermissionAction[]>>>(
      (matrix, permission) => {
        const area = toPermissionArea(permission.moduleCode);
        const action = toPermissionAction(permission.actionCode);
        if (!area || !action) return matrix;
        matrix[area] = [...(matrix[area] ?? []), action];
        return matrix;
      },
      {},
    ),
  };
}

function toPermissionArea(moduleCode: string): PermissionArea | null {
  const allowed = new Set<PermissionArea>([
    "dashboard",
    "content",
    "events",
    "bookings",
    "payments",
    "users",
    "roles",
    "settings",
    "audit_logs",
  ]);
  const mapped = moduleCode === "audit" ? "audit_logs" : moduleCode;
  return allowed.has(mapped as PermissionArea) ? (mapped as PermissionArea) : null;
}

function toPermissionAction(actionCode: string): PermissionAction | null {
  if (actionCode === "manage") return "manage_users";
  if (actionCode === "access") return "view";
  const allowed = new Set<PermissionAction>([
    "view",
    "create",
    "edit",
    "publish",
    "archive",
    "acknowledge",
    "resolve",
  ]);
  return allowed.has(actionCode as PermissionAction) ? (actionCode as PermissionAction) : null;
}

function toSettingsSnapshot(
  settings: Array<{
    readonly settingGroup: string;
    readonly settingKey: string;
    readonly valueJson: unknown;
  }>,
  emailDiagnostics?: {
    readonly ready: boolean;
    readonly statusLabel: string;
    readonly missingConfiguration: string[];
    readonly invalidConfiguration: string[];
    readonly fromAddressConfigured: boolean;
    readonly adminAddressConfigured: boolean;
    readonly publicBaseUrlConfigured: boolean;
    readonly smtpHost?: string;
    readonly smtpPort?: number;
    readonly smtpSecure?: boolean;
  },
): AdminSettingsSnapshot {
  const values = new Map(
    settings.map((setting) => [
      `${setting.settingGroup}.${setting.settingKey}`,
      formatSettingValue(setting.valueJson),
    ]),
  );
  return {
    isDemo: false,
    id: "settings-operational",
    general: {
      "Park name": values.get("general.park_name") ?? "Yorùbá Heritage Park",
      "Operational status":
        values.get("general.operational_status") ?? "Pending operational confirmation",
    },
    visitorInformation: {
      "Opening information":
        values.get("visitor.opening_information") ?? "Pending operational confirmation",
      "Visitor guidance": values.get("visitor.guidance") ?? "Pending operational confirmation",
    },
    booking: {
      "Booking mode": values.get("booking.mode") ?? "MySQL-backed request intake",
      Availability: values.get("booking.availability") ?? "Pending operational confirmation",
    },
    payments: {
      "Payment provider": values.get("payments.provider") ?? "Sandbox configuration pending",
      "Refund policy": values.get("payments.refund_policy") ?? "Awaiting authorised content",
    },
    notifications: {
      Email:
        projectStatus.emailEnabled && emailDiagnostics?.ready
          ? "Enabled via SMTP"
          : (emailDiagnostics?.statusLabel ?? "Not configured"),
      "Email sender": emailDiagnostics?.fromAddressConfigured ? "Configured" : "Missing",
      "Admin recipient": emailDiagnostics?.adminAddressConfigured ? "Configured" : "Uses sender",
      "Public email links": emailDiagnostics?.publicBaseUrlConfigured
        ? "Production URL configured"
        : "Missing EMAIL_PUBLIC_BASE_URL",
      "SMTP endpoint": emailDiagnostics?.smtpHost
        ? `${emailDiagnostics.smtpHost}:${emailDiagnostics.smtpPort ?? 587} (${emailDiagnostics.smtpSecure ? "secure" : "starttls"})`
        : "Missing SMTP_HOST",
      "Email blockers": [
        ...(emailDiagnostics?.missingConfiguration ?? []),
        ...(emailDiagnostics?.invalidConfiguration ?? []),
      ].length
        ? [
            ...(emailDiagnostics?.missingConfiguration ?? []),
            ...(emailDiagnostics?.invalidConfiguration ?? []),
          ].join(", ")
        : "None detected in application environment",
      SMS: projectStatus.smsEnabled ? "Enabled" : "Provider not configured",
      WhatsApp: projectStatus.whatsappEnabled ? "Enabled" : "Provider not configured",
    },
    safety: {},
    media: {
      "Upload mode": projectStatus.mediaUploadEnabled ? "Enabled" : "Provider not configured",
      "Storage provider": values.get("media.storage_provider") ?? "Provider required",
    },
    seo: {
      "Meta review": values.get("seo.meta_review") ?? "Production metadata published",
    },
    legalPrivacy: {
      "Legal terms": values.get("legal.terms") ?? "Awaiting authorised content",
      "Privacy information": values.get("legal.privacy") ?? "Awaiting authorised content",
    },
  };
}

function formatSettingValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
