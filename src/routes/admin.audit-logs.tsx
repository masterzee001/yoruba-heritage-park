import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Copy, Download } from "lucide-react";
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
  DemoBadge,
  DetailRow,
  FeatureDisabledNotice,
  FilterChip,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { adminService } from "@/admin/services";
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
  successful_preview: "Successful Preview",
  denied_preview: "Denied Preview",
  failed_preview: "Failed Preview",
  informational: "Informational",
};

const OUTCOME_TONE: Record<AuditOutcome, StatusTone> = {
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
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.auditLogs
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Audit logs could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const selected = useMemo(
    () => rows?.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );
  const completePreviewAction = () =>
    setNotice("Preview action completed locally. No production record was created.");

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Audit logs" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Audit logs"
        description="Audit records shown here are demonstration data. Production audit logging is not yet connected."
      />
      <PreviewModeBanner message="Audit records shown here are demonstration data. Production audit logging is not yet connected." />
      <FeatureDisabledNotice
        feature="Production audit capture and export"
        reason="No real browser data, IP address, device fingerprint, tamper-proof log or export file is captured."
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
            "sos",
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
      </AdminFilterBar>
      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
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
            caption="Audit preview records"
            emptyTitle="No audit records"
            emptyDescription="No preview audit records match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.reference}
              title={selected.action}
              actions={
                <>
                  <AdminStatusBadge tone={OUTCOME_TONE[selected.outcome]}>
                    {OUTCOME_LABEL[selected.outcome]}
                  </AdminStatusBadge>
                  <DemoBadge />
                </>
              }
            >
              <dl>
                <DetailRow label="Date and time">{selected.occurredAt}</DetailRow>
                <DetailRow label="User">{selected.userPlaceholder}</DetailRow>
                <DetailRow label="Module">{selected.module}</DetailRow>
                <DetailRow label="Record">{selected.recordReference}</DetailRow>
                <DetailRow label="IP placeholder">{selected.ipPlaceholder}</DetailRow>
                <DetailRow label="Device">{selected.devicePlaceholder}</DetailRow>
                <DetailRow label="Details">{selected.details}</DetailRow>
              </dl>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<Download className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Export preview action
                </PreviewButton>
                <PreviewButton icon={<Copy className="size-3.5" />} onClick={completePreviewAction}>
                  Copy-reference preview
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : null}
        </div>
      )}
    </>
  );
}

function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-xs text-forest-deep">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

function PreviewButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:border-forest"
    >
      {icon}
      {children}
    </button>
  );
}
