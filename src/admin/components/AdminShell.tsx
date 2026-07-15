import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getAdminAuthState, submitAdminLogout } from "@/admin/auth-functions";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: ReactNode;
}

/**
 * Admin layout wrapper. Persistent desktop sidebar, mobile drawer trigger in
 * the header, and a scrollable, overflow-safe main content area.
 *
 * The public site header/footer must NOT appear inside admin routes —
 * `__root.tsx` already skips them when the pathname starts with `/admin`.
 */
export function AdminShell({ children }: Props) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<Awaited<ReturnType<typeof getAdminAuthState>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminAuthState().then((state) => {
      if (!cancelled) setAuth(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[oklch(0.97_0.005_150)] text-charcoal">
      <div className="grid min-h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border lg:block">
          <div className="sticky top-0 h-dvh">
            <AdminSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <AdminHeader
            operatorName={auth?.principal?.displayName}
            operatorInitials={auth?.principal?.initials}
            operatorRoleLabel={auth?.principal?.roleLabels[0]}
            showLogout={auth?.authenticationActive === true}
            onLogout={async () => {
              const result = await submitAdminLogout();
              if (result.redirectTo) await navigate({ to: result.redirectTo });
            }}
          />
          <main
            id="admin-main"
            className="min-w-0 flex-1 space-y-6 overflow-x-hidden p-4 md:p-8 lg:p-10"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
