import "@tanstack/react-start/server-only";

import { getCookie } from "@tanstack/start-server-core";

import { createAuthService } from "../server/auth/auth-runtime";
import { getAuthConfig } from "../server/auth/auth-config";
import { requireAuthenticatedUser } from "../server/auth/require-auth";
import { requirePermission } from "../server/auth/permissions";

export async function requireAdminServerPermission(permissionCode: string) {
  const config = getAuthConfig();
  const principal =
    config.mode === "database"
      ? await createAuthService().getSession(getCookie(config.sessionCookieName))
      : null;
  return requirePermission(requireAuthenticatedUser(principal), permissionCode);
}
