import { createServerFn } from "@tanstack/react-start";

export const getAdminAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const { getAuthConfig } = await import("../server/auth/auth-config");
  const config = getAuthConfig();
  return {
    mode: config.mode,
    previewMessage:
      config.mode === "disabled"
        ? "Administrator authentication is not active in this preview environment."
        : null,
  };
});

export const submitAdminLogin = createServerFn({ method: "POST" })
  .validator((data: { email?: string; password?: string; returnTo?: string }) => data)
  .handler(async ({ data }) => {
    const { getAuthConfig } = await import("../server/auth/auth-config");
    const config = getAuthConfig();
    if (config.mode === "disabled") {
      return {
        ok: false,
        message: "Administrator authentication is not active in this preview environment.",
      };
    }
    return {
      ok: false,
      message:
        data.email && data.password
          ? "Database authentication is implemented but activation is pending server cookie integration."
          : "The email address or password could not be verified.",
    };
  });

export const submitAdminLogout = createServerFn({ method: "POST" }).handler(async () => {
  return { ok: true, redirectTo: "/admin/login" };
});
