import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Ticket,
  Users,
  Calendar,
  ShieldAlert,
  ClipboardList,
  BookOpen,
  Home,
  Image,
  Settings,
  KeyRound,
  ScrollText,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administrator — Yoruba Heritage Park" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pages", label: "Pages & content", icon: FileText },
  { to: "/admin/experiences", label: "Experiences", icon: BookOpen },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/bookings", label: "Bookings & tickets", icon: Ticket },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/enquiries", label: "Enquiries", icon: ClipboardList },
  { to: "/admin/sos", label: "SOS alerts", icon: ShieldAlert, danger: true },
  { to: "/admin/incidents", label: "Incidents", icon: ShieldAlert },
  { to: "/admin/learning", label: "Learning resources", icon: BookOpen },
  { to: "/admin/stay", label: "Stay & Own", icon: Home },
  { to: "/admin/media", label: "Media", icon: Image },
  { to: "/admin/staff", label: "Staff users", icon: Users },
  { to: "/admin/roles", label: "Roles & permissions", icon: KeyRound },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/audit", label: "Audit logs", icon: ScrollText },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh bg-[oklch(0.97_0.005_150)] text-charcoal">
      <div className="grid min-h-dvh lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-border bg-forest-deep text-ivory lg:flex lg:flex-col">
          <div className="border-b border-ivory/10 px-6 py-6">
            <p className="text-[10px] uppercase tracking-widest text-ivory/50">Administrator</p>
            <p className="mt-1 font-serif text-lg">Yoruba Heritage Park</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 text-sm">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`mb-0.5 flex items-center gap-3 rounded-sm px-3 py-2.5 transition ${
                    active
                      ? "bg-ivory/10 text-ivory"
                      : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                  } ${n.danger ? "text-destructive-foreground/90" : ""}`}
                >
                  <n.icon className={`size-4 ${n.danger ? "text-destructive" : ""}`} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-ivory/10 px-6 py-4 text-xs text-ivory/50">
            Prototype · mock data
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
            <div className="flex items-center gap-3 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-forest-deep">
                ← Public site
              </Link>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Operator: Sample User</span>
              <span className="grid size-8 place-items-center rounded-full bg-forest-deep text-ivory">
                SU
              </span>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-6 md:p-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
