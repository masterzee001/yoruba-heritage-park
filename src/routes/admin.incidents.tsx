import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, FileText, UserCheck } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminConfirmationDialog,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTimeline,
  PendingBadge,
  DetailRow,
  FeatureDisabledNotice,
  FilterChip,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { adminService } from "@/admin/services";
import type {
  AdminIncident,
  IncidentCategory,
  IncidentFilters,
  IncidentSeverity,
  IncidentStatus,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/incidents")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Incidents — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminIncidentsRoute,
});

const STATUS_LABEL: Record<IncidentStatus, string> = {
  test: "Test",
  reported: "Reported",
  under_review: "Under Review",
  acknowledged_preview: "Acknowledged Preview",
  responding_preview: "Responding Preview",
  resolved_preview: "Resolved Preview",
  false_alarm: "False Alarm",
  closed: "Closed",
};

const STATUS_TONE: Record<IncidentStatus, StatusTone> = {
  test: "preview",
  reported: "warning",
  under_review: "info",
  acknowledged_preview: "warning",
  responding_preview: "info",
  resolved_preview: "success",
  false_alarm: "muted",
  closed: "neutral",
};

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical_preview: "Critical Preview",
};

const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  medical: "Medical",
  lost_or_separated: "Lost or separated",
  fire: "Fire",
  injury: "Injury",
  animal: "Animal",
  facility: "Facility",
  security: "Security",
  other: "Other",
};

const columns: AdminColumn<AdminIncident>[] = [
  {
    key: "reference",
    header: "Incident",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "category", header: "Category", render: (row) => CATEGORY_LABEL[row.category] },
  { key: "severity", header: "Severity", render: (row) => SEVERITY_LABEL[row.severity] },
  { key: "reported", header: "Reported", hideOnMobile: true, render: (row) => row.reportedAt },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminIncidentsRoute() {
  const [rows, setRows] = useState<AdminIncident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<IncidentFilters>({
    category: "all",
    severity: "all",
    status: "all",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService.incidents
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Incident records could not be loaded."));
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
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Incidents" }]} />
      <AdminPageHeader
        eyebrow="Safety operations"
        title="Incidents"
        description="INCIDENT PREVIEW MODE: No live emergency response, staff dispatch or external notification is connected."
        actions={<AdminStatusBadge tone="danger">Preview only</AdminStatusBadge>}
      />
      <PreviewModeBanner
        variant="danger"
        message="INCIDENT PREVIEW MODE. No live emergency response, staff dispatch or external notification is connected."
      />
      <FeatureDisabledNotice
        feature="Incident dispatch and notifications"
        reason="Assignment, acknowledgement, resolution and closure actions are pending operational setup."
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
          ["all", "reported", "under_review", "acknowledged_preview", "resolved_preview"] as const
        ).map((status) => (
          <FilterChip
            key={status}
            active={(filters.status ?? "all") === status}
            onClick={() => setFilters((current) => ({ ...current, status }))}
          >
            {status === "all" ? "All" : STATUS_LABEL[status]}
          </FilterChip>
        ))}
        <select
          value={filters.category ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              category: event.currentTarget.value as IncidentFilters["category"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Incident category"
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filters.severity ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              severity: event.currentTarget.value as IncidentFilters["severity"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Incident severity"
        >
          <option value="all">All severities</option>
          {Object.entries(SEVERITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
          aria-label="Incident date"
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
            caption="Incident preview records"
            emptyTitle="No incident records"
            emptyDescription="No preview incidents match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.reference}
              title={`${CATEGORY_LABEL[selected.category]} — ${SEVERITY_LABEL[selected.severity]}`}
              actions={
                <>
                  <AdminStatusBadge tone={STATUS_TONE[selected.status]}>
                    {STATUS_LABEL[selected.status]}
                  </AdminStatusBadge>
                  <PendingBadge />
                </>
              }
            >
              <dl>
                <DetailRow label="Source">{selected.source}</DetailRow>
                <DetailRow label="Visitor/ticket">{selected.visitorOrTicketPlaceholder}</DetailRow>
                <DetailRow label="Location">{selected.locationDescriptionPlaceholder}</DetailRow>
                <DetailRow label="GPS">{selected.gpsPlaceholder}</DetailRow>
                <DetailRow label="Reported">{selected.reportedAt}</DetailRow>
                <DetailRow label="Assigned officer">
                  {selected.assignedOfficerPlaceholder}
                </DetailRow>
                <DetailRow label="Acknowledged">
                  {selected.acknowledgedAt ?? "Not acknowledged"}
                </DetailRow>
                <DetailRow label="Related safety alert">
                  {selected.relatedSosReference ?? "No related safety alert"}
                </DetailRow>
                <DetailRow label="Evidence">{selected.evidencePlaceholder}</DetailRow>
                <DetailRow label="Response notes">{selected.responseNotes}</DetailRow>
                <DetailRow label="Resolution notes">{selected.resolutionNotes}</DetailRow>
              </dl>
              <div className="mt-6">
                <AdminTimeline items={selected.timeline} />
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<UserCheck className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Local assignment preview
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Local acknowledgement preview
                </PreviewButton>
                <PreviewButton
                  icon={<FileText className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Local note preview
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Local resolution preview
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={() => setCloseOpen(true)}
                >
                  Closure confirmation preview
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No incident selected">
              <p className="text-sm text-muted-foreground">Select a preview incident record.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminConfirmationDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close preview incident?"
        description="This will only update local interface state for the current session."
        confirmLabel="Close locally"
        onConfirm={() => {
          setCloseOpen(false);
          completePreviewAction();
        }}
      />
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
