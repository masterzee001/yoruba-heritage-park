import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/admin/components";

export const Route = createFileRoute("/admin")({
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
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
