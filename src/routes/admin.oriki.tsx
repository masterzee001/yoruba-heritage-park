import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, MessageSquarePlus, UserCheck } from "lucide-react";
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
  AdminTimeline,
  DemoBadge,
  DetailRow,
  FeatureDisabledNotice,
  FilterChip,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { adminService } from "@/admin/services";
import type {
  AdminOrikiRequest,
  OrikiFilters,
  OrikiRequestStatus,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/oriki")({
  head: () => ({
    meta: [{ title: "Oríkì Services — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminOrikiRoute,
});

const STATUS_LABEL: Record<OrikiRequestStatus, string> = {
  new: "New",
  under_review: "Under Review",
  awaiting_information: "Awaiting Information",
  consultation_proposed: "Consultation Proposed",
  scheduled_preview: "Scheduled Preview",
  cultural_review: "Cultural Review",
  completed_preview: "Completed Preview",
  closed: "Closed",
};

const STATUS_TONE: Record<OrikiRequestStatus, StatusTone> = {
  new: "warning",
  under_review: "info",
  awaiting_information: "warning",
  consultation_proposed: "info",
  scheduled_preview: "success",
  cultural_review: "warning",
  completed_preview: "success",
  closed: "neutral",
};

const columns: AdminColumn<AdminOrikiRequest>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "visitor", header: "Visitor", render: (row) => row.visitorName },
  { key: "type", header: "Type", hideOnMobile: true, render: (row) => row.requestType },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminOrikiRoute() {
  const [rows, setRows] = useState<AdminOrikiRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrikiFilters>({ status: "all", requestType: "all" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.oriki
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Oríkì requests could not be loaded."));
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
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Oríkì services" }]} />
      <AdminPageHeader
        eyebrow="Specialist services"
        title="Oríkì and heritage services"
        description="Respectful consultation-management preview. No Oríkì content is generated or approved here."
        actions={<AdminStatusBadge tone="preview">Cultural review pending</AdminStatusBadge>}
      />
      <PreviewModeBanner message="No Oríkì content is generated or culturally approved through this preview interface." />
      <FeatureDisabledNotice
        feature="Oríkì generation and cultural approval"
        reason="This interface records preview workflow state only and does not assign real practitioners or send visitor communications."
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
            "new",
            "under_review",
            "awaiting_information",
            "consultation_proposed",
            "cultural_review",
          ] as const
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
          value={filters.requestType ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              requestType: event.currentTarget.value as OrikiFilters["requestType"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Request type"
        >
          <option value="all">All request types</option>
          <option value="personal">Personal</option>
          <option value="family">Family</option>
        </select>
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
            caption="Oríkì consultation records"
            emptyTitle="No Oríkì requests"
            emptyDescription="No preview requests match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.reference}
              title={selected.visitorName}
              actions={
                <>
                  <AdminStatusBadge tone={STATUS_TONE[selected.status]}>
                    {STATUS_LABEL[selected.status]}
                  </AdminStatusBadge>
                  <DemoBadge />
                </>
              }
            >
              <dl>
                <DetailRow label="Request type">{selected.requestType}</DetailRow>
                <DetailRow label="Visitor email">{selected.visitorEmail}</DetailRow>
                <DetailRow label="Preferred format">{selected.preferredFormat}</DetailRow>
                <DetailRow label="Cultural review">{selected.culturalReviewStatus}</DetailRow>
                <DetailRow label="Appointment state">{selected.appointmentState}</DetailRow>
                <DetailRow label="Assigned practitioner">
                  {selected.assignedPractitionerPlaceholder}
                </DetailRow>
                <DetailRow label="Delivery state">{selected.deliveryStatePlaceholder}</DetailRow>
                <DetailRow label="Internal notes">{selected.internalNotes}</DetailRow>
              </dl>
              <div className="mt-6">
                <AdminTimeline items={selected.timeline} />
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<UserCheck className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Assign for review locally
                </PreviewButton>
                <PreviewButton
                  icon={<MessageSquarePlus className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Add internal note locally
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Propose consultation locally
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Close request locally
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No request selected">
              <p className="text-sm text-muted-foreground">Select a preview Oríkì request.</p>
            </AdminDetailPanel>
          )}
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
