import "@tanstack/react-start/server-only";

import type { AuthConfig, RequestContext } from "./auth-types";

export interface SessionCookieOptions {
  readonly config: AuthConfig;
  readonly absoluteExpiresAt: Date;
  readonly requestContext?: RequestContext;
}

export function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function getSessionTokenFromCookie(
  cookieHeader: string | null | undefined,
  cookieName: string,
): string | null {
  const value = parseCookieHeader(cookieHeader)[cookieName];
  if (!value || !/^[A-Za-z0-9_-]{32,256}$/.test(value)) return null;
  return value;
}

export function buildSessionCookie(token: string, options: SessionCookieOptions): string {
  return buildCookie(options.config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: shouldUseSecureCookie(options.config, options.requestContext),
    path: "/admin",
    expires: options.absoluteExpiresAt,
  });
}

export function buildExpiredSessionCookie(config: AuthConfig): string {
  return buildCookie(config.sessionCookieName, "", {
    httpOnly: true,
    sameSite: "Lax",
    secure: config.nodeEnv === "production",
    path: "/admin",
    expires: new Date(0),
    maxAge: 0,
  });
}

export function shouldUseSecureCookie(config: AuthConfig, context?: RequestContext): boolean {
  if (config.nodeEnv === "production") return true;
  if (!context) return false;
  if (context.protocol === "https") return true;
  return config.trustProxy && context.forwardedProto?.split(",")[0]?.trim() === "https";
}

function buildCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    sameSite: "Lax";
    secure: boolean;
    path: string;
    expires: Date;
    maxAge?: number;
  },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Expires=${options.expires.toUTCString()}`,
    "SameSite=Lax",
  ];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
