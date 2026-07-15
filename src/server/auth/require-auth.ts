import "@tanstack/react-start/server-only";

import { AuthError } from "./auth-errors";
import type { AuthenticatedPrincipal } from "./auth-types";
import { getRequiredPermissionForPath, requirePermission } from "./permissions";

export function requireAuthenticatedUser(
  principal: AuthenticatedPrincipal | null,
): AuthenticatedPrincipal {
  if (!principal) throw new AuthError();
  return principal;
}

export function requireAdminRoutePermission(
  principal: AuthenticatedPrincipal,
  pathname: string,
): AuthenticatedPrincipal {
  const permission = getRequiredPermissionForPath(pathname);
  if (!permission) return principal;
  return requirePermission(principal, permission);
}
