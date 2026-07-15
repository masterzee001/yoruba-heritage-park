import { Link } from "@tanstack/react-router";
import { Compass, CalendarDays, Ticket } from "lucide-react";

const items = [
  { to: "/experiences", label: "Explore", Icon: Compass },
  { to: "/events", label: "Events", Icon: CalendarDays },
  { to: "/tickets", label: "Tickets", Icon: Ticket },
] as const;

export function MobileBottomBar() {
  return (
    <nav
      aria-label="Primary mobile actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-foreground/75"
              activeProps={{
                className: "text-forest-deep font-medium",
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
