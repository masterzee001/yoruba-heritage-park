import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  DetailRow,
  FilterChip,
  type AdminColumn,
} from "@/admin/components";
import { listAdminAuditLogs } from "@/admin/audit-log-functions";
import type {
  AdminAuditLog,
  AuditLogFilters,
  AuditOutcome,
  PermissionArea,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/audit-logs")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Audit Logs — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAuditLogsRoute,
});

const OUTCOME_LABEL: Record<AuditOutcome, string> = {
  success: "Success",
  denied: "Denied",
  failed: "Failed",
  successful_preview: "Successful",
  denied_preview: "Denied",
  failed_preview: "Failed",
  informational: "Informational",
};

const OUTCOME_TONE: Record<AuditOutcome, StatusTone> = {
  success: "success",
  denied: "warning",
  failed: "danger",
  successful_preview: "success",
  denied_preview: "warning",
  failed_preview: "danger",
  informational: "info",
};

const columns: AdminColumn<AdminAuditLog>[] = [
  {
    key: "ref",
    header: "Audit",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "time", header: "Time", render: (row) => row.occurredAt },
  { key: "user", header: "User", hideOnMobile: true, render: (row) => row.userPlaceholder },
  { key: "module", header: "Module", hideOnMobile: true, render: (row) => row.module },
  {
    key: "outcome",
    header: "Outcome",
    render: (row) => (
      <AdminStatusBadge tone={OUTCOME_TONE[row.outcome]}>
        {OUTCOME_LABEL[row.outcome]}
      </AdminStatusBadge>
    ),
  },
];

function AdminAuditLogsRoute() {
  const [rows, setRows] = useState<AdminAuditLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({ module: "all", outcome: "all" });

  const loadLogs = useCallback(async () => {
    setError(null);
    const list = await listAdminAuditLogs({ data: filters });
    setRows(list);
    setSelectedId((current) =>
      current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
    );
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    loadLogs().catch(() => {
      if (!cancelled) setError("Audit logs could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [loadLogs]);

  const selected = useMemo(
    () => rows?.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Audit logs" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Audit logs"
        description="Review database-backed administrator actions, payment review notes, and security events."
        actions={<AdminStatusBadge tone="success">Database-backed</AdminStatusBadge>}
      />
      <AdminFilterBar>
        <AdminSearchInput
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.currentTarget.value }))
          }
          className="min-w-[220px] flex-1"
        />
        {(
          [
            "all",
            "success",
            "denied",
            "failed",
            "successful_preview",
            "denied_preview",
            "failed_preview",
            "informational",
          ] as const
        ).map((outcome) => (
          <FilterChip
            key={outcome}
            active={(filters.outcome ?? "all") === outcome}
            onClick={() => setFilters((current) => ({ ...current, outcome }))}
          >
            {outcome === "all" ? "All" : OUTCOME_LABEL[outcome]}
          </FilterChip>
        ))}
        <select
          value={filters.module ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              module: event.currentTarget.value as PermissionArea | "all",
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Module"
        >
          <option value="all">All modules</option>
          {[
            "dashboard",
            "content",
            "events",
            "bookings",
            "payments",
            "incidents",
            "users",
            "roles",
            "settings",
            "audit_logs",
          ].map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, date: event.currentTarget.value }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Audit date"
        />
        <button
          type="button"
          onClick={() => void loadLogs()}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:border-forest"
        >
          <RotateCw className="size-3.5" aria-hidden />
          Refresh
        </button>
      </AdminFilterBar>
      {error ? (
        <AdminErrorState description={error} />
      ) : !rows ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
          <AdminDataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            caption="Database audit records"
            emptyTitle="No audit records"
            emptyDescription="No database audit records match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.reference}
              title={selected.action}
              actions={
                <AdminStatusBadge tone={OUTCOME_TONE[selected.outcome]}>
                  {OUTCOME_LABEL[selected.outcome]}
                </AdminStatusBadge>
              }
            >
              <dl>
                <DetailRow label="Date and time">{selected.occurredAt}</DetailRow>
                <DetailRow label="User">{selected.userPlaceholder}</DetailRow>
                <DetailRow label="Module">{selected.module}</DetailRow>
                <DetailRow label="Record">{selected.recordReference}</DetailRow>
                <DetailRow label="IP address">{selected.ipPlaceholder}</DetailRow>
                <DetailRow label="Device">{selected.devicePlaceholder}</DetailRow>
                <DetailRow label="Details">{selected.details}</DetailRow>
              </dl>
            </AdminDetailPanel>
          ) : null}
        </div>
      )}
    </>
  );
}
