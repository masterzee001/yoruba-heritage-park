import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { AdminMobileNavigation } from "./AdminMobileNavigation";

interface Props {
  operatorName?: string;
  operatorInitials?: string;
  operatorRoleLabel?: string;
}

export function AdminHeader({
  operatorName = "Sample Operator",
  operatorInitials = "SO",
  operatorRoleLabel = "Preview session",
}: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNavigation />
        <Link
          to="/"
          className="hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-forest-deep sm:inline-flex"
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
          aria-hidden
          className="grid size-9 place-items-center rounded-full bg-forest-deep text-xs text-ivory"
        >
          {operatorInitials}
        </span>
      </div>
    </header>
  );
}
