import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "../nav";

interface Props {
  compact?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ compact = false, onNavigate }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className={cn("flex h-full flex-col bg-forest-deep text-ivory", compact && "text-sm")}>
      <div className="border-b border-ivory/10 px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/50">Administrator</p>
        <p className="mt-1 font-serif text-lg leading-tight">Yorùbá Heritage Park</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 text-sm" aria-label="Admin navigation">
        {ADMIN_NAV.map((group) => (
          <div key={group.id} className="mb-4">
            <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.22em] text-ivory/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
                const content = (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-1 left-0 w-[3px] rounded-r-sm transition",
                        active ? "bg-brass" : "bg-transparent",
                      )}
                    />
                    <item.icon
                      className={cn(
                        "size-4 shrink-0",
                        item.danger ? "text-destructive" : "",
                        active && !item.danger ? "text-brass" : "",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full border border-ivory/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ivory/40">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                );

                const base =
                  "relative flex items-center gap-3 rounded-sm px-3 py-2 min-h-9 transition";

                return (
                  <li key={item.to}>
                    {item.disabled ? (
                      <span
                        className={cn(base, "text-ivory/35")}
                        aria-disabled="true"
                        title="Not available in preview mode"
                      >
                        {content}
                      </span>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        className={cn(
                          base,
                          "outline-none focus-visible:ring-2 focus-visible:ring-brass/70 focus-visible:ring-offset-0",
                          active
                            ? "bg-ivory/10 text-ivory font-medium"
                            : "text-ivory/75 hover:bg-ivory/5 hover:text-ivory",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-ivory/10 px-5 py-4 text-[11px] text-ivory/50">
        Preview mode · demonstration data only
      </div>
    </div>
  );
}
