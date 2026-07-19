import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  PreviewModeBanner,
} from "@/admin/components";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { adminService } from "@/admin/services";
import type { DashboardSummary } from "@/admin/services";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.dashboard
      .summary()
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setError("Dashboard summary could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Operational overview of the park administration portal."
        meta="Operational baseline"
      />

      <PreviewModeBanner />

      {error ? (
        <AdminErrorState description={error} />
      ) : !summary ? (
        <AdminLoadingState rows={2} />
      ) : (
        <section
          aria-label="Operational overview"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AdminStatCard
            label="Visitors today"
            value={summary.visitorsToday}
            hint="Awaiting operational confirmation"
          />
          <AdminStatCard
            label="Upcoming bookings"
            value={summary.upcomingBookings}
            hint="Confirmed and pending booking records"
          />
          <AdminStatCard
            label="Pending enquiries"
            value={summary.pendingEnquiries}
            hint="Enquiries awaiting first review"
          />
        </section>
      )}

      <section>
        <div className="rounded-sm border border-border bg-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest-deep">Getting started</h2>
            <AdminStatusBadge tone="preview">Foundation phase</AdminStatusBadge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The administrator portal foundation is in place. Individual operational modules
            (bookings, tickets, payments, enquiries and governance) will read from the same typed
            service layer used here.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-charcoal">
            <li>- Admin shell, sidebar and mobile drawer navigation are active.</li>
            <li>- Pending modules are labelled before operational connection.</li>
            <li>- Database-backed modules use server-side permission checks.</li>
            <li>- Live payments, email and SMS remain locked behind environment configuration.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
