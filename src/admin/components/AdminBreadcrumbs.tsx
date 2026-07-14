import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface AdminBreadcrumb {
  label: string;
  to?: string;
}

export function AdminBreadcrumbs({ items }: { items: AdminBreadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.to && !last ? (
                <Link to={item.to} className="hover:text-forest-deep">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "text-charcoal" : ""}>{item.label}</span>
              )}
              {!last ? <ChevronRight className="size-3" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
