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
import { projectStatus } from "@/config/project-status";

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
  { to: "/admin/pages", label: "Pages & content", icon: FileText, disabled: true },
  { to: "/admin/experiences", label: "Experiences", icon: BookOpen, disabled: true },
  { to: "/admin/events", label: "Events", icon: Calendar, disabled: true },
  { to: "/admin/bookings", label: "Bookings & tickets", icon: Ticket, disabled: true },
  { to: "/admin/payments", label: "Payments", icon: Wallet, disabled: true },
  { to: "/admin/enquiries", label: "Enquiries", icon: ClipboardList, disabled: true },
  { to: "/admin/sos", label: "SOS alerts", icon: ShieldAlert, danger: true },
  { to: "/admin/incidents", label: "Incidents", icon: ShieldAlert, disabled: true },
  { to: "/admin/learning", label: "Learning resources", icon: BookOpen, disabled: true },
  { to: "/admin/stay", label: "Stay & Own", icon: Home, disabled: true },
  { to: "/admin/media", label: "Media", icon: Image, disabled: true },
  { to: "/admin/staff", label: "Staff users", icon: Users, disabled: true },
  { to: "/admin/roles", label: "Roles & permissions", icon: KeyRound, disabled: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, disabled: true },
  { to: "/admin/audit", label: "Audit logs", icon: ScrollText, disabled: true },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const demoMode = projectStatus.contentMode === "preview";
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
              const className = `mb-0.5 flex items-center gap-3 rounded-sm px-3 py-2.5 transition ${
                active
                  ? "bg-ivory/10 text-ivory"
                  : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
              } ${n.danger ? "text-destructive-foreground/90" : ""} ${
                n.disabled
                  ? "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-ivory/70"
                  : ""
              }`;

              if (n.disabled) {
                return (
                  <span key={n.to} className={className} aria-disabled="true">
                    <n.icon className={`size-4 ${n.danger ? "text-destructive" : ""}`} />
                    {n.label}
                  </span>
                );
              }

              return (
                <Link key={n.to} to={n.to} className={className}>
                  <n.icon className={`size-4 ${n.danger ? "text-destructive" : ""}`} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-ivory/10 px-6 py-4 text-xs text-ivory/50">
            Non-production · demonstration data
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
            {demoMode && (
              <div className="mb-6 rounded-sm border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
                Non-production dashboard: metrics, bookings, payments and SOS alerts shown here are
                demonstration data only.
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
