import "@tanstack/react-start/server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { RequestContext } from "./auth-types";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyCsrfToken(
  rawToken: string | null | undefined,
  expectedHash: string,
): boolean {
  if (!rawToken || !/^[A-Za-z0-9_-]{32,256}$/.test(rawToken)) return false;
  const actual = Buffer.from(hashToken(rawToken), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isStateChangingMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

export function isSameOriginRequest(context: RequestContext): boolean {
  if (!context.origin || !context.host) return true;
  try {
    const origin = new URL(context.origin);
    return origin.host === context.host;
  } catch {
    return false;
  }
}
