import { Link, useRouterState } from "@tanstack/react-router";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminMobileNavigation } from "./AdminMobileNavigation";
import { ADMIN_NAV_FLAT } from "../nav";

interface Props {
  operatorName?: string;
  operatorInitials?: string;
  operatorRoleLabel?: string;
  showLogout?: boolean;
  onLogout?: () => void;
}

export function AdminHeader({
  operatorName = "Sample Operator",
  operatorInitials = "SO",
  operatorRoleLabel = "Administrator session",
  showLogout = false,
  onLogout,
}: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current =
    ADMIN_NAV_FLAT.find((i) =>
      i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`),
    ) ?? null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNavigation />
        <div className="min-w-0 lg:hidden">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Administrator
          </p>
          <p className="truncate font-serif text-sm text-forest-deep">
            {current?.label ?? "Yorùbá Heritage Park"}
          </p>
        </div>
        <Link
          to="/"
          className="admin-focus hidden items-center gap-1.5 rounded-sm px-1 py-1 text-xs text-muted-foreground hover:text-forest-deep lg:inline-flex"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          View public website
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium text-charcoal">{operatorName}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {operatorRoleLabel}
          </p>
        </div>
        <span
          aria-label={`${operatorName}, ${operatorRoleLabel}`}
          className="grid size-9 place-items-center rounded-full bg-forest-deep text-xs font-medium text-ivory"
        >
          {operatorInitials}
        </span>
        {showLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="admin-focus inline-flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-forest-deep"
            aria-label="Log out"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </header>
  );
}
