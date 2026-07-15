import "@tanstack/react-start/server-only";

import { ForbiddenError } from "./auth-errors";
import type { AuthenticatedPrincipal } from "./auth-types";

export const adminRoutePermissionMap = {
  "/admin": "admin.access",
  "/admin/content": "content.view",
  "/admin/experiences": "content.view",
  "/admin/events": "events.view",
  "/admin/calendar": "events.view",
  "/admin/bookings": "bookings.view",
  "/admin/tickets": "bookings.view",
  "/admin/enquiries": "enquiries.view",
  "/admin/appointments": "appointments.view",
  "/admin/payments": "payments.view",
  "/admin/learning": "content.view",
  "/admin/oriki": "enquiries.view",
  "/admin/ceremonies": "enquiries.view",
  "/admin/stay-own": "enquiries.view",
  "/admin/media": "content.view",
  "/admin/sos": "safety.view",
  "/admin/incidents": "safety.view",
  "/admin/users": "users.manage",
  "/admin/roles": "roles.manage",
  "/admin/settings": "settings.manage",
  "/admin/audit-logs": "audit.view",
} as const;

export type AdminRoutePath = keyof typeof adminRoutePermissionMap;

export function getRequiredPermissionForPath(pathname: string): string | null {
  const cleanPath = pathname.replace(/\/$/, "") || "/admin";
  const match = Object.keys(adminRoutePermissionMap)
    .sort((a, b) => b.length - a.length)
    .find((route) => cleanPath === route || cleanPath.startsWith(`${route}/`));
  return match ? adminRoutePermissionMap[match as AdminRoutePath] : null;
}

export function hasPermission(principal: AuthenticatedPrincipal, permissionCode: string): boolean {
  return principal.permissionCodes.includes(permissionCode);
}

export function requirePermission(
  principal: AuthenticatedPrincipal,
  permissionCode: string,
): AuthenticatedPrincipal {
  if (!hasPermission(principal, permissionCode)) throw new ForbiddenError();
  return principal;
}

export function requireAnyPermission(
  principal: AuthenticatedPrincipal,
  permissionCodes: string[],
): AuthenticatedPrincipal {
  if (!permissionCodes.some((code) => hasPermission(principal, code))) throw new ForbiddenError();
  return principal;
}

export function requireRole(
  principal: AuthenticatedPrincipal,
  roleCode: string,
): AuthenticatedPrincipal {
  if (!principal.roleCodes.includes(roleCode)) throw new ForbiddenError();
  return principal;
}
