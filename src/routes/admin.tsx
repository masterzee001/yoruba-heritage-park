import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/admin/components";
import { getAdminRouteAccess } from "@/admin/auth-functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const auth = await getAdminRouteAccess({ data: { pathname: location.pathname } });
    if (auth.authenticationActive && !auth.authenticated) {
      throw redirect({
        to: "/admin/login",
        search: { returnTo: location.href },
      });
    }
    if (auth.forbidden) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Administrator — Yorùbá Heritage Park" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content:
          "Yorùbá Heritage Park administrator portal — preview interface. Not a public page.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/admin/login") return <Outlet />;

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
