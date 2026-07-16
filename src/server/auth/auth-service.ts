import "@tanstack/react-start/server-only";

import type {
  AuditLogRepository,
  LoginAttemptsRepository,
  RolesRepository,
  SessionsRepository,
  UsersRepository,
} from "../repositories";
import { normaliseEmail } from "../repositories/mysql/mysql-helpers";
import { buildSessionCookie } from "./session-cookie";
import { genericLoginFailure } from "./auth-errors";
import type {
  AuthConfig,
  AuthenticatedPrincipal,
  LoginFailureReason,
  LoginResult,
  LogoutResult,
  RequestContext,
} from "./auth-types";
import { generateCsrfToken, hashToken, isSameOriginRequest, verifyCsrfToken } from "./csrf";
import { hashLoginIdentifier, getRequestIpHash, isLoginRateLimited } from "./login-throttle";
import { performDefensivePasswordHash, verifyPassword } from "./password";
import {
  calculateSessionExpiry,
  generateSessionToken,
  hashSessionToken,
  shouldRefreshLastSeen,
} from "./session";

export interface AuthServiceDependencies {
  readonly config: AuthConfig;
  readonly usersRepository: UsersRepository;
  readonly rolesRepository: RolesRepository;
  readonly sessionsRepository: SessionsRepository;
  readonly loginAttemptsRepository: LoginAttemptsRepository;
  readonly auditLogRepository?: AuditLogRepository;
}

export class AuthService {
  constructor(private readonly deps: AuthServiceDependencies) {}

  async login(input: {
    readonly email: string;
    readonly password: string;
    readonly returnTo?: string | null;
    readonly requestContext: RequestContext;
  }): Promise<LoginResult> {
    if (this.deps.config.mode !== "database") {
      return failure("invalid_credentials");
    }
    if (!isSameOriginRequest(input.requestContext)) {
      return failure("invalid_credentials");
    }

    const now = new Date();
    const email = safeNormaliseEmail(input.email);
    const emailHash = hashLoginIdentifier(email ?? input.email);
    const ipHash = getRequestIpHash(input.requestContext);

    if (
      await isLoginRateLimited({
        attemptsRepository: this.deps.loginAttemptsRepository,
        config: this.deps.config,
        emailHash,
        ipHash,
        now,
      })
    ) {
      await this.recordAttempt(emailHash, ipHash, "rate_limited", now);
      await this.recordAudit(null, "auth.login.rate_limited", "denied", input.requestContext);
      return failure("rate_limited");
    }

    const user = email
      ? await this.deps.usersRepository.findAuthenticationRecordByEmail(email)
      : null;
    if (!user || !user.passwordHash) {
      await performDefensivePasswordHash(input.password);
      await this.recordAttempt(emailHash, ipHash, "invalid_credentials", now);
      await this.recordAudit(null, "auth.login.failure", "failed", input.requestContext);
      return failure("invalid_credentials");
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      await this.recordAttempt(emailHash, ipHash, "account_locked", now, user.id);
      await this.recordAudit(user.id, "auth.account.locked", "denied", input.requestContext);
      return failure("account_locked");
    }

    if (user.accountStatus !== "active" || user.archivedAt) {
      await this.recordAttempt(emailHash, ipHash, "account_disabled", now, user.id);
      await this.recordAudit(user.id, "auth.login.failure", "denied", input.requestContext);
      return failure("account_disabled");
    }

    const verified = await verifyPassword(input.password, user.passwordHash);
    if (!verified) {
      const failedLoginCount = user.failedLoginCount + 1;
      const lockedUntil =
        failedLoginCount >= this.deps.config.maxLoginAttempts
          ? new Date(now.getTime() + this.deps.config.accountLockMinutes * 60_000)
          : null;
      await this.deps.usersRepository.updateFailedLoginState({
        userId: user.id,
        failedLoginCount,
        lockedUntil,
      });
      await this.recordAttempt(emailHash, ipHash, "invalid_credentials", now, user.id);
      await this.recordAudit(user.id, "auth.login.failure", "failed", input.requestContext);
      if (lockedUntil)
        await this.recordAudit(user.id, "auth.account.locked", "denied", input.requestContext);
      return failure("invalid_credentials");
    }

    const sessionToken = generateSessionToken();
    const csrfToken = generateCsrfToken();
    const expiry = calculateSessionExpiry(this.deps.config, now);
    await this.deps.sessionsRepository.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      csrfTokenHash: hashToken(csrfToken),
      createdAt: now,
      lastSeenAt: now,
      idleExpiresAt: expiry.idleExpiresAt,
      absoluteExpiresAt: expiry.absoluteExpiresAt,
      ipHash,
      userAgentHash: hashLoginIdentifier(input.requestContext.userAgent),
    });
    await this.deps.usersRepository.updateLastLogin(user.id, now);
    await this.recordAttempt(emailHash, ipHash, "success", now, user.id);
    await this.recordAudit(user.id, "auth.login.success", "success", input.requestContext);

    const principal = await this.buildPrincipal(user.id, {
      sessionId: "current",
      sessionExpiresAt: expiry.absoluteExpiresAt,
      csrfToken,
    });
    return {
      ok: true,
      principal,
      csrfToken,
      cookieHeader: buildSessionCookie(sessionToken, {
        config: this.deps.config,
        absoluteExpiresAt: expiry.absoluteExpiresAt,
        requestContext: input.requestContext,
      }),
      returnTo: sanitizeAdminReturnPath(input.returnTo),
    };
  }

  async logout(input: {
    readonly sessionToken: string | null | undefined;
    readonly csrfToken: string | null | undefined;
    readonly requestContext?: RequestContext;
  }): Promise<LogoutResult> {
    if (!input.sessionToken) return { ok: true };

    const tokenHash = hashSessionToken(input.sessionToken);
    const session = await this.deps.sessionsRepository.findActiveByTokenHash(tokenHash);
    if (!session) return { ok: true };

    if (
      !isSameOriginRequest(input.requestContext ?? {}) ||
      !verifyCsrfToken(input.csrfToken, session.csrfTokenHash)
    ) {
      await this.recordAudit(
        session.userId,
        "auth.logout.csrf_denied",
        "denied",
        input.requestContext,
      );
      return {
        ok: false,
        message: "The logout request could not be verified. Refresh the admin page and try again.",
      };
    }

    await this.deps.sessionsRepository.revokeByTokenHash(tokenHash, "logout");
    await this.recordAudit(session.userId, "auth.logout", "success", input.requestContext);
    return { ok: true };
  }

  async getSession(
    sessionToken: string | null | undefined,
  ): Promise<AuthenticatedPrincipal | null> {
    if (!sessionToken || this.deps.config.mode !== "database") return null;
    const tokenHash = hashSessionToken(sessionToken);
    const session = await this.deps.sessionsRepository.findActiveByTokenHash(tokenHash);
    if (!session) return null;
    const now = new Date();
    if (shouldRefreshLastSeen(session.lastSeenAt, now)) {
      const absoluteCap = session.absoluteExpiresAt.getTime();
      const idleExpiresAt = new Date(
        Math.min(now.getTime() + this.deps.config.sessionIdleMinutes * 60_000, absoluteCap),
      );
      await this.deps.sessionsRepository.updateLastSeen(session.id, now, idleExpiresAt);
    }
    return this.buildPrincipal(session.userId, {
      sessionId: session.id,
      sessionExpiresAt: session.absoluteExpiresAt,
    });
  }

  async revokeUserSessions(userId: string, reason: string): Promise<number> {
    return this.deps.sessionsRepository.revokeAllForUser(userId, reason);
  }

  private async buildPrincipal(
    userId: string,
    session: { sessionId: string; sessionExpiresAt: Date; csrfToken?: string },
  ): Promise<AuthenticatedPrincipal> {
    const user = await this.deps.usersRepository.findSafeUserById(userId);
    if (!user || user.accountStatus !== "active" || user.archivedAt) {
      throw new Error("Authenticated user is no longer active.");
    }
    const roles = await this.deps.rolesRepository.listRolesForUser(userId);
    const permissions = await this.deps.rolesRepository.listPermissionsForUser(userId);
    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      accountStatus: user.accountStatus,
      roleCodes: roles.map((role) => role.roleCode),
      roleLabels: roles.map((role) => role.displayName),
      permissionCodes: permissions.map((permission) => permission.permissionCode),
      sessionId: session.sessionId,
      sessionExpiresAt: session.sessionExpiresAt,
      csrfToken: session.csrfToken,
    };
  }

  private async recordAttempt(
    emailHash: string,
    ipHash: string,
    outcome: Parameters<LoginAttemptsRepository["record"]>[0]["outcome"],
    attemptedAt: Date,
    userId?: string | null,
  ): Promise<void> {
    await this.deps.loginAttemptsRepository.record({
      emailHash,
      ipHash,
      outcome,
      attemptedAt,
      userId: userId ?? null,
      metadataJson: { source: "admin_login" },
    });
  }

  private async recordAudit(
    actorUserId: string | null,
    actionCode: string,
    outcome: "success" | "denied" | "failed" | "informational",
    requestContext?: RequestContext,
  ): Promise<void> {
    await this.deps.auditLogRepository?.record({
      actorUserId,
      actionCode,
      moduleCode: "auth",
      outcome,
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
      metadataJson: { event: actionCode },
    });
  }
}

export function sanitizeAdminReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) return "/admin";
  try {
    const parsed = new URL(value, "https://yhp.local");
    if (parsed.origin !== "https://yhp.local" || !parsed.pathname.startsWith("/admin")) {
      return "/admin";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/admin";
  }
}

function safeNormaliseEmail(email: string): string | null {
  try {
    return normaliseEmail(email);
  } catch {
    return null;
  }
}

function failure(reason: LoginFailureReason): LoginResult {
  return { ok: false, reason, message: genericLoginFailure };
}
