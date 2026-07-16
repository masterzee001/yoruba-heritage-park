import { describe, expect, test } from "bun:test";

import { AuthService, sanitizeAdminReturnPath } from "../src/server/auth/auth-service";
import {
  verifyCsrfToken,
  generateCsrfToken,
  hashToken,
  isStateChangingMethod,
} from "../src/server/auth/csrf";
import { isLoginRateLimited } from "../src/server/auth/login-throttle";
import {
  hashPassword,
  needsPasswordRehash,
  passwordHashProfile,
  verifyPassword,
} from "../src/server/auth/password";
import { getRequiredPermissionForPath, requirePermission } from "../src/server/auth/permissions";
import {
  buildSessionCookie,
  getSessionTokenFromCookie,
  shouldUseSecureCookie,
} from "../src/server/auth/session-cookie";
import {
  calculateSessionExpiry,
  generateSessionToken,
  hashSessionToken,
} from "../src/server/auth/session";
import { getServerEnv, ServerEnvError } from "../src/server/env/server-env";
import type {
  AuditLogRepository,
  LoginAttemptsRepository,
  RolesRepository,
  SessionsRepository,
  UsersRepository,
} from "../src/server/repositories";
import type { AuthenticationRecord } from "../src/server/auth/auth-types";
import type { CreateLoginAttemptInput } from "../src/server/repositories/login-attempts-repository";
import type {
  CreateSessionInput,
  SessionAuthenticationRecord,
  SessionRecord,
} from "../src/server/repositories/sessions-repository";
import type {
  PermissionRecord,
  RoleRecord,
  UserRecord,
} from "../src/server/repositories/repository-types";

const config = {
  mode: "database" as const,
  sessionCookieName: "yhp_admin",
  sessionIdleMinutes: 30,
  sessionAbsoluteHours: 8,
  loginWindowMinutes: 15,
  maxLoginAttempts: 5,
  accountLockMinutes: 15,
  passwordMinLength: 15,
  trustProxy: true,
  nodeEnv: "development",
};

describe("auth environment validation", () => {
  test("disabled mode needs no database variables", () => {
    expect(getServerEnv({ source: { AUTH_MODE: "disabled" } }).auth.mode).toBe("disabled");
  });

  test("database mode requires database variables", () => {
    expect(() => getServerEnv({ source: { AUTH_MODE: "database" } })).toThrow(ServerEnvError);
  });

  test("validates auth numeric bounds and cookie names", () => {
    expect(() => getServerEnv({ source: { AUTH_SESSION_IDLE_MINUTES: "1" } })).toThrow();
    expect(() => getServerEnv({ source: { AUTH_SESSION_COOKIE_NAME: "bad cookie" } })).toThrow();
  });
});

describe("password hashing", () => {
  test("same password produces different salts and verifies", async () => {
    const password = "Olódùmárè secure password 123";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("wrong password", first)).toBe(false);
  });

  test("unicode password verifies and malformed hashes fail safely", async () => {
    const hash = await hashPassword("àṣẹ-password-Ọrun-12345");
    expect(await verifyPassword("àṣẹ-password-Ọrun-12345", hash)).toBe(true);
    expect(await verifyPassword("anything", "$bad$hash")).toBe(false);
    expect(needsPasswordRehash("$bad$hash")).toBe(true);
    expect(needsPasswordRehash(hash)).toBe(false);
  });

  test("documents the selected scrypt profile", () => {
    expect(passwordHashProfile).toMatchObject({ N: 32768, r: 8, p: 3, keyLength: 64 });
  });
});

describe("session and cookie helpers", () => {
  test("generates opaque tokens and stores only hashes", () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hashSessionToken(token)).toHaveLength(64);
    expect(hashSessionToken(token)).not.toBe(token);
  });

  test("calculates idle and absolute expiry", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiry = calculateSessionExpiry(config, now);
    expect(expiry.idleExpiresAt.toISOString()).toBe("2026-01-01T00:30:00.000Z");
    expect(expiry.absoluteExpiresAt.toISOString()).toBe("2026-01-01T08:00:00.000Z");
  });

  test("cookie properties are secure and scoped", () => {
    const header = buildSessionCookie("abc_123456789012345678901234567890", {
      config,
      absoluteExpiresAt: new Date("2026-01-01T08:00:00.000Z"),
      requestContext: { forwardedProto: "https" },
    });
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/admin");
    expect(header).toContain("Secure");
    expect(
      getSessionTokenFromCookie("yhp_admin=abc_123456789012345678901234567890", "yhp_admin"),
    ).toBeTruthy();
    expect(shouldUseSecureCookie({ ...config, nodeEnv: "production" }, {})).toBe(true);
  });
});

describe("csrf protection", () => {
  test("valid token passes and missing or incorrect tokens fail", () => {
    const token = generateCsrfToken();
    const expectedHash = hashToken(token);
    expect(verifyCsrfToken(token, expectedHash)).toBe(true);
    expect(verifyCsrfToken(null, expectedHash)).toBe(false);
    expect(verifyCsrfToken("wrong-token", expectedHash)).toBe(false);
    expect(isStateChangingMethod("POST")).toBe(true);
    expect(isStateChangingMethod("GET")).toBe(false);
  });
});

describe("login flow and authorisation", () => {
  test("unknown and wrong-password failures are generic", async () => {
    const service = makeService({ user: null });
    const unknown = await service.login({
      email: "unknown@example.test",
      password: "not-secret",
      requestContext: {},
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok)
      expect(unknown.message).toBe("The email address or password could not be verified.");

    const passwordHash = await hashPassword("correct secure password");
    const wrong = await makeService({ user: makeAuthUser(passwordHash) }).login({
      email: "admin@example.test",
      password: "wrong secure password",
      requestContext: {},
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok)
      expect(wrong.message).toBe("The email address or password could not be verified.");
  });

  test("successful login resets failures and creates a hashed-token session", async () => {
    const passwordHash = await hashPassword("correct secure password");
    const deps = makeDeps({ user: makeAuthUser(passwordHash) });
    const service = new AuthService(deps);
    const result = await service.login({
      email: "admin@example.test",
      password: "correct secure password",
      returnTo: "/admin/users",
      requestContext: {},
    });
    expect(result.ok).toBe(true);
    expect(deps.sessions.created[0].tokenHash).toHaveLength(64);
    expect(deps.users.lastLoginUserId).toBe("user_admin");
  });

  test("logout requires the session CSRF token before revoking", async () => {
    const passwordHash = await hashPassword("correct secure password");
    const deps = makeDeps({ user: makeAuthUser(passwordHash) });
    const service = new AuthService(deps);
    const login = await service.login({
      email: "admin@example.test",
      password: "correct secure password",
      requestContext: {},
    });
    expect(login.ok).toBe(true);
    if (!login.ok) return;

    const sessionToken = getSessionTokenFromCookie(login.cookieHeader, config.sessionCookieName);
    const denied = await service.logout({
      sessionToken,
      csrfToken: "wrong-token",
      requestContext: {},
    });
    expect(denied.ok).toBe(false);
    expect(deps.sessions.revokedTokenHashes).toHaveLength(0);

    const allowed = await service.logout({
      sessionToken,
      csrfToken: login.csrfToken,
      requestContext: {},
    });
    expect(allowed.ok).toBe(true);
    expect(deps.sessions.revokedTokenHashes).toEqual([deps.sessions.created[0].tokenHash]);
  });

  test("lockout and rate limit apply", async () => {
    const passwordHash = await hashPassword("correct secure password");
    const deps = makeDeps({ user: makeAuthUser(passwordHash, { failedLoginCount: 4 }) });
    const result = await new AuthService(deps).login({
      email: "admin@example.test",
      password: "wrong secure password",
      requestContext: {},
    });
    expect(result.ok).toBe(false);
    expect(deps.users.failedState?.lockedUntil).toBeInstanceOf(Date);

    const attempts = makeAttemptsRepository(5);
    expect(
      await isLoginRateLimited({
        attemptsRepository: attempts,
        config,
        emailHash: "email",
        ipHash: "ip",
        now: new Date(),
      }),
    ).toBe(true);
  });

  test("disabled and suspended users cannot log in", async () => {
    const passwordHash = await hashPassword("correct secure password");
    const disabled = await makeService({
      user: makeAuthUser(passwordHash, { accountStatus: "disabled" }),
    }).login({
      email: "admin@example.test",
      password: "correct secure password",
      requestContext: {},
    });
    expect(disabled.ok).toBe(false);
  });

  test("route map covers admin routes and permissions are server-enforced", () => {
    expect(getRequiredPermissionForPath("/admin/users")).toBe("users.manage");
    expect(getRequiredPermissionForPath("/admin/roles")).toBe("roles.manage");
    const principal = {
      userId: "u",
      email: "a@example.test",
      displayName: "Admin",
      accountStatus: "active" as const,
      roleCodes: ["viewer_auditor"],
      roleLabels: ["Viewer or Auditor"],
      permissionCodes: ["admin.access"],
      sessionId: "s",
      sessionExpiresAt: new Date(),
    };
    expect(() => requirePermission(principal, "users.manage")).toThrow();
  });
});

describe("redirect safety", () => {
  test("only internal admin return paths pass", () => {
    expect(sanitizeAdminReturnPath("/admin/users")).toBe("/admin/users");
    expect(sanitizeAdminReturnPath("https://evil.test/admin")).toBe("/admin");
    expect(sanitizeAdminReturnPath("//evil.test/admin")).toBe("/admin");
    expect(sanitizeAdminReturnPath("/")).toBe("/admin");
  });
});

function makeService(options: { user: AuthenticationRecord | null }) {
  return new AuthService(makeDeps(options));
}

function makeDeps(options: { user: AuthenticationRecord | null }) {
  const users = makeUsersRepository(options.user);
  const sessions = makeSessionsRepository();
  return {
    config,
    usersRepository: users,
    rolesRepository: makeRolesRepository(),
    sessionsRepository: sessions,
    loginAttemptsRepository: makeAttemptsRepository(0),
    auditLogRepository: makeAuditRepository(),
    users,
    sessions,
  };
}

function makeAuthUser(
  passwordHash: string,
  overrides: Partial<AuthenticationRecord> = {},
): AuthenticationRecord {
  return {
    id: "user_admin",
    email: "admin@example.test",
    displayName: "Admin User",
    passwordHash,
    accountStatus: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    archivedAt: null,
    ...overrides,
  };
}

function makeUserRecord(auth: AuthenticationRecord): UserRecord {
  return {
    id: auth.id,
    email: auth.email,
    displayName: auth.displayName,
    accountStatus: auth.accountStatus,
    emailVerifiedAt: new Date(),
    lastLoginAt: null,
    failedLoginCount: auth.failedLoginCount,
    lockedUntil: auth.lockedUntil,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: auth.archivedAt,
  };
}

function makeUsersRepository(user: AuthenticationRecord | null) {
  return {
    lastLoginUserId: null as string | null,
    failedState: null as {
      userId: string;
      failedLoginCount: number;
      lockedUntil?: Date | null;
    } | null,
    async findById() {
      return user ? makeUserRecord(user) : null;
    },
    async findByEmail() {
      return user ? makeUserRecord(user) : null;
    },
    async findSafeUserById() {
      return user ? makeUserRecord(user) : null;
    },
    async findAuthenticationRecordByEmail() {
      return user;
    },
    async updateFailedLoginState(input) {
      this.failedState = input;
    },
    async updateLastLogin(userId) {
      this.lastLoginUserId = userId;
    },
    async setPasswordHash() {},
  } satisfies UsersRepository & {
    lastLoginUserId: string | null;
    failedState: { userId: string; failedLoginCount: number; lockedUntil?: Date | null } | null;
  };
}

function makeRolesRepository(): RolesRepository {
  const role: RoleRecord = {
    id: "role_super",
    roleCode: "super_administrator",
    displayName: "Super Administrator",
    description: null,
    isSystemRole: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const permission: PermissionRecord = {
    id: "perm_admin",
    permissionCode: "admin.access",
    moduleCode: "admin",
    actionCode: "access",
    description: null,
    createdAt: new Date(),
  };
  return {
    async findById() {
      return role;
    },
    async findByCode() {
      return role;
    },
    async listRoles() {
      return [role];
    },
    async listPermissionsForRole() {
      return [permission];
    },
    async listRolesForUser() {
      return [role];
    },
    async listPermissionsForUser() {
      return [permission, { ...permission, id: "perm_users", permissionCode: "users.manage" }];
    },
    async permissionExists() {
      return true;
    },
  };
}

function makeSessionsRepository(): SessionsRepository & {
  created: CreateSessionInput[];
  revokedTokenHashes: string[];
} {
  return {
    created: [],
    revokedTokenHashes: [],
    async create(input) {
      this.created.push(input);
      return {
        id: "session_1",
        userId: input.userId,
        tokenHash: input.tokenHash,
        csrfTokenHash: input.csrfTokenHash,
        createdAt: input.createdAt,
        lastSeenAt: input.lastSeenAt,
        idleExpiresAt: input.idleExpiresAt,
        absoluteExpiresAt: input.absoluteExpiresAt,
        revokedAt: null,
        revokedReason: null,
      };
    },
    async findActiveByTokenHash(tokenHash): Promise<SessionAuthenticationRecord | null> {
      const input = this.created.find((session) => session.tokenHash === tokenHash);
      if (!input || this.revokedTokenHashes.includes(tokenHash)) return null;
      return {
        id: "session_1",
        userId: input.userId,
        tokenHash: input.tokenHash,
        csrfTokenHash: input.csrfTokenHash,
        createdAt: input.createdAt,
        lastSeenAt: input.lastSeenAt,
        idleExpiresAt: input.idleExpiresAt,
        absoluteExpiresAt: input.absoluteExpiresAt,
        revokedAt: null,
        revokedReason: null,
        principal: {
          userId: input.userId,
          email: "admin@example.test",
          displayName: "Admin User",
          accountStatus: "active",
          roleCodes: ["super_administrator"],
          roleLabels: ["Super Administrator"],
          permissionCodes: ["admin.access", "users.manage"],
        },
      };
    },
    async updateLastSeen() {},
    async revokeByTokenHash(tokenHash) {
      this.revokedTokenHashes.push(tokenHash);
      return true;
    },
    async revokeBySessionId() {
      return true;
    },
    async revokeAllForUser() {
      return 1;
    },
  };
}

function makeAttemptsRepository(failures: number): LoginAttemptsRepository {
  return {
    attempts: [] as CreateLoginAttemptInput[],
    async record(input) {
      this.attempts.push(input);
    },
    async countRecentFailures() {
      return { emailFailures: failures, ipFailures: failures };
    },
  } as LoginAttemptsRepository & { attempts: CreateLoginAttemptInput[] };
}

function makeAuditRepository(): AuditLogRepository {
  return {
    async findById() {
      return null;
    },
    async listRecent() {
      return [];
    },
    async record(input) {
      return {
        id: "audit_1",
        actorUserId: input.actorUserId ?? null,
        actionCode: input.actionCode,
        moduleCode: input.moduleCode,
        recordType: input.recordType ?? null,
        recordId: input.recordId ?? null,
        outcome: input.outcome,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadataJson: input.metadataJson ?? {},
        createdAt: new Date(),
      };
    },
  };
}
