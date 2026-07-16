import "@tanstack/react-start/server-only";

import {
  deleteCookie,
  getCookie,
  getRequest,
  getRequestHeader,
  getRequestHost,
  getRequestIP,
  getRequestProtocol,
  setCookie,
} from "@tanstack/start-server-core";

import {
  MysqlAuditLogRepository,
  MysqlLoginAttemptsRepository,
  MysqlRolesRepository,
  MysqlSessionsRepository,
  MysqlUsersRepository,
} from "../repositories/mysql";
import { getAuthConfig } from "./auth-config";
import { AuthService } from "./auth-service";
import type { AuthenticatedPrincipal, RequestContext } from "./auth-types";
import { getRequiredPermissionForPath, hasPermission } from "./permissions";
import { shouldUseSecureCookie } from "./session-cookie";

export interface AdminAuthState {
  readonly mode: "disabled" | "database";
  readonly authenticationActive: boolean;
  readonly authenticated: boolean;
  readonly forbidden: boolean;
  readonly csrfCookieName: string | null;
  readonly previewMessage: string | null;
  readonly principal: {
    readonly displayName: string;
    readonly initials: string;
    readonly roleLabels: string[];
  } | null;
}

export function createAuthService(): AuthService {
  return new AuthService({
    config: getAuthConfig(),
    usersRepository: new MysqlUsersRepository(),
    rolesRepository: new MysqlRolesRepository(),
    sessionsRepository: new MysqlSessionsRepository(),
    loginAttemptsRepository: new MysqlLoginAttemptsRepository(),
    auditLogRepository: new MysqlAuditLogRepository(),
  });
}

export async function getCurrentAdminAuthState(pathname = "/admin"): Promise<AdminAuthState> {
  const config = getAuthConfig();
  if (config.mode === "disabled") {
    return {
      mode: "disabled",
      authenticationActive: false,
      authenticated: false,
      forbidden: false,
      csrfCookieName: null,
      previewMessage: "Administrator authentication is not active in this preview environment.",
      principal: null,
    };
  }

  const token = getCookie(config.sessionCookieName);
  const principal = await createAuthService().getSession(token);
  if (!principal) {
    return {
      mode: "database",
      authenticationActive: true,
      authenticated: false,
      forbidden: false,
      csrfCookieName: getAdminCsrfCookieName(config.sessionCookieName),
      previewMessage: null,
      principal: null,
    };
  }

  const requiredPermission = getRequiredPermissionForPath(pathname);
  const forbidden = requiredPermission ? !hasPermission(principal, requiredPermission) : false;
  return {
    mode: "database",
    authenticationActive: true,
    authenticated: true,
    forbidden,
    csrfCookieName: getAdminCsrfCookieName(config.sessionCookieName),
    previewMessage: null,
    principal: toPublicPrincipal(principal),
  };
}

export function getRuntimeRequestContext(): RequestContext {
  const config = getAuthConfig();
  const request = getRequest();
  return {
    ipAddress: getRequestIP({ xForwardedFor: config.trustProxy }) ?? null,
    userAgent: request.headers.get("user-agent"),
    origin: request.headers.get("origin"),
    host: getRequestHost({ xForwardedHost: config.trustProxy }),
    protocol: getRequestProtocol({ xForwardedProto: config.trustProxy }),
    forwardedProto: getRequestHeader("x-forwarded-proto"),
  };
}

export function setAdminSessionCookie(cookieHeader: string): void {
  const parsed = parseSetCookie(cookieHeader);
  setCookie(parsed.name, parsed.value, {
    path: parsed.path,
    expires: parsed.expires,
    httpOnly: parsed.httpOnly,
    secure: parsed.secure,
    sameSite: parsed.sameSite?.toLowerCase() as "lax",
  });
}

export function clearAdminSessionCookie(): void {
  const config = getAuthConfig();
  deleteCookie(config.sessionCookieName, { path: "/admin" });
}

export function getAdminCsrfCookieName(sessionCookieName: string): string {
  return `${sessionCookieName}_csrf`;
}

export function setAdminCsrfCookie(
  csrfToken: string,
  absoluteExpiresAt: Date,
  requestContext: RequestContext,
): void {
  const config = getAuthConfig();
  setCookie(getAdminCsrfCookieName(config.sessionCookieName), csrfToken, {
    path: "/admin",
    expires: absoluteExpiresAt,
    httpOnly: false,
    secure: shouldUseSecureCookie(config, requestContext),
    sameSite: "lax",
  });
}

export function clearAdminCsrfCookie(): void {
  const config = getAuthConfig();
  deleteCookie(getAdminCsrfCookieName(config.sessionCookieName), { path: "/admin" });
}

function toPublicPrincipal(principal: AuthenticatedPrincipal): AdminAuthState["principal"] {
  return {
    displayName: principal.displayName,
    initials: principal.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(""),
    roleLabels: principal.roleLabels,
  };
}

function parseSetCookie(header: string): {
  name: string;
  value: string;
  path: string;
  expires: Date;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax";
} {
  const parts = header.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = parts;
  const separator = nameValue.indexOf("=");
  const name = nameValue.slice(0, separator);
  const value = decodeURIComponent(nameValue.slice(separator + 1));
  const attributeMap = new Map(
    attributes.map((attribute) => {
      const index = attribute.indexOf("=");
      return index === -1
        ? [attribute.toLowerCase(), "true"]
        : [attribute.slice(0, index).toLowerCase(), attribute.slice(index + 1)];
    }),
  );
  return {
    name,
    value,
    path: attributeMap.get("path") ?? "/admin",
    expires: new Date(attributeMap.get("expires") ?? Date.now()),
    httpOnly: attributeMap.has("httponly"),
    secure: attributeMap.has("secure"),
    sameSite: "Lax",
  };
}
