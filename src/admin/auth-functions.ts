import { createServerFn } from "@tanstack/react-start";

export const getAdminAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentAdminAuthState } = await import("../server/auth/auth-runtime");
  return getCurrentAdminAuthState();
});

export const getAdminRouteAccess = createServerFn({ method: "GET" })
  .validator((data: { pathname?: string }) => data)
  .handler(async ({ data }) => {
    const { getCurrentAdminAuthState } = await import("../server/auth/auth-runtime");
    return getCurrentAdminAuthState(data.pathname ?? "/admin");
  });

export const submitAdminLogin = createServerFn({ method: "POST" })
  .validator((data: { email?: string; password?: string; returnTo?: string }) => data)
  .handler(async ({ data }) => {
    const { getAuthConfig } = await import("../server/auth/auth-config");
    const {
      createAuthService,
      getRuntimeRequestContext,
      setAdminCsrfCookie,
      setAdminSessionCookie,
    } = await import("../server/auth/auth-runtime");
    const config = getAuthConfig();
    if (config.mode === "disabled") {
      return {
        ok: false,
        message: "Administrator authentication is not active in this preview environment.",
      };
    }
    const result = await createAuthService().login({
      email: data.email ?? "",
      password: data.password ?? "",
      returnTo: data.returnTo,
      requestContext: getRuntimeRequestContext(),
    });
    if (!result.ok) return { ok: false, message: result.message };
    setAdminSessionCookie(result.cookieHeader);
    setAdminCsrfCookie(
      result.csrfToken,
      result.principal.sessionExpiresAt,
      getRuntimeRequestContext(),
    );
    return { ok: true, returnTo: result.returnTo };
  });

export const submitAdminLogout = createServerFn({ method: "POST" })
  .validator((data: { csrfToken?: string | null }) => data)
  .handler(async ({ data }) => {
    const { getAuthConfig } = await import("../server/auth/auth-config");
    const {
      clearAdminCsrfCookie,
      clearAdminSessionCookie,
      createAuthService,
      getRuntimeRequestContext,
    } = await import("../server/auth/auth-runtime");
    const { getCookie } = await import("@tanstack/start-server-core");
    const config = getAuthConfig();
    if (config.mode === "database") {
      const result = await createAuthService().logout({
        sessionToken: getCookie(config.sessionCookieName),
        csrfToken: data.csrfToken,
        requestContext: getRuntimeRequestContext(),
      });
      if (!result.ok) return result;
    }
    clearAdminSessionCookie();
    clearAdminCsrfCookie();
    return { ok: true, redirectTo: "/staff-access" };
  });
