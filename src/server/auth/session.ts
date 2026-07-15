import "@tanstack/react-start/server-only";

import { createHash, randomBytes } from "node:crypto";

import type { AuthConfig } from "./auth-types";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function calculateSessionExpiry(config: AuthConfig, now = new Date()) {
  const idleExpiresAt = new Date(now.getTime() + config.sessionIdleMinutes * 60_000);
  const absoluteExpiresAt = new Date(now.getTime() + config.sessionAbsoluteHours * 60 * 60_000);
  return { idleExpiresAt, absoluteExpiresAt };
}

export function shouldRefreshLastSeen(lastSeenAt: Date, now = new Date()): boolean {
  return now.getTime() - lastSeenAt.getTime() >= 5 * 60_000;
}
