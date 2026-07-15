import { redirect } from "@tanstack/react-router";

import { getAdminRouteAccess } from "./auth-functions";

interface AdminRouteLocation {
  readonly pathname: string;
  readonly href: string;
}

export async function requireAdminRouteAccess(location: AdminRouteLocation): Promise<void> {
  const auth = await getAdminRouteAccess({ data: { pathname: location.pathname } });
  if (auth.authenticationActive && !auth.authenticated) {
    throw redirect({
      to: "/staff-access",
      search: { returnTo: location.href },
    });
  }
  if (auth.forbidden) {
    throw new Error("Forbidden");
  }
}
