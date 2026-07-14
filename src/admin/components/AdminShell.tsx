import type { ReactNode } from "react";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

/**
 * Admin layout wrapper. Renders the persistent desktop sidebar, the header
 * with the mobile drawer trigger, and the scrollable main content area.
 *
 * The public site header and footer must NOT appear inside admin routes —
 * `__root.tsx` already skips them when the pathname starts with `/admin`.
 */
export function AdminShell({ children }: Props) {
  return (
    <div className="min-h-dvh bg-[oklch(0.97_0.005_150)] text-charcoal">
      <div className="grid min-h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border lg:block">
          <div className="sticky top-0 h-dvh">
            <AdminSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <AdminHeader />
          <main className="min-w-0 flex-1 space-y-6 p-4 md:p-8 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
