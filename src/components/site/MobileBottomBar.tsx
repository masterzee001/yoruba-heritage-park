import { Link } from "@tanstack/react-router";
import { Compass, CalendarDays, Ticket, ShieldAlert } from "lucide-react";

const items = [
  { to: "/experiences", label: "Explore", Icon: Compass, danger: false },
  { to: "/events", label: "Events", Icon: CalendarDays, danger: false },
  { to: "/tickets", label: "Tickets", Icon: Ticket, danger: false },
  { to: "/sos", label: "SOS", Icon: ShieldAlert, danger: true },
] as const;

export function MobileBottomBar() {
  return (
    <nav
      aria-label="Primary mobile actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, Icon, danger }) => (
          <li key={to}>
            <Link
              to={to}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                danger ? "text-destructive" : "text-foreground/75"
              }`}
              activeProps={{
                className: danger ? "text-destructive font-medium" : "text-forest-deep font-medium",
              }}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
