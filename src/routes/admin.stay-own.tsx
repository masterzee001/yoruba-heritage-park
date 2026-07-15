import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarPlus, CheckCircle2, MessageSquarePlus, UserCheck } from "lucide-react";
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
import type { AdminStayOwnEnquiry, StatusTone, StayOwnFilters, StayOwnStatus } from "@/admin/types";

export const Route = createFileRoute("/admin/stay-own")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Stay & Own — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminStayOwnRoute,
});

const STATUS_LABEL: Record<StayOwnStatus, string> = {
  new: "New",
  contact_review: "Contact Review",
  information_requested: "Information Requested",
  inspection_proposed: "Inspection Proposed",
  inspection_preview: "Inspection Preview",
  follow_up: "Follow-Up",
  closed: "Closed",
  not_proceeding: "Not Proceeding",
};

const STATUS_TONE: Record<StayOwnStatus, StatusTone> = {
  new: "warning",
  contact_review: "info",
  information_requested: "warning",
  inspection_proposed: "info",
  inspection_preview: "preview",
  follow_up: "warning",
  closed: "neutral",
  not_proceeding: "muted",
};

const columns: AdminColumn<AdminStayOwnEnquiry>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "visitor", header: "Visitor", render: (row) => row.visitorName },
  { key: "interest", header: "Interest", hideOnMobile: true, render: (row) => row.interest },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminStayOwnRoute() {
  const [rows, setRows] = useState<AdminStayOwnEnquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<StayOwnFilters>({ status: "all", inspectionState: "all" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.stayOwn
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Stay & Own enquiries could not be loaded."));
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
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Stay & Own" }]} />
      <AdminPageHeader
        eyebrow="Commercial enquiries"
        title="Stay & Own"
        description="Preview enquiry-management interface only. Property transactions are outside the current system."
      />
      <PreviewModeBanner message="This module manages preview enquiries only. Property transactions are outside the current system." />
      <FeatureDisabledNotice
        feature="Property transactions"
        reason="Purchases, deposits, contracts, ownership records, legal transfers and property payments are not implemented."
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
            "contact_review",
            "information_requested",
            "inspection_proposed",
            "follow_up",
            "closed",
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
          value={filters.inspectionState ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              inspectionState: event.currentTarget.value as StayOwnFilters["inspectionState"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Inspection state"
        >
          <option value="all">All inspections</option>
          <option value="not_started">Not started</option>
          <option value="proposed_preview">Proposed preview</option>
          <option value="inspection_preview">Inspection preview</option>
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
            caption="Stay & Own enquiry records"
            emptyTitle="No Stay & Own enquiries"
            emptyDescription="No preview enquiries match the selected filters."
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
                <DetailRow label="Email">{selected.visitorEmail}</DetailRow>
                <DetailRow label="Phone">{selected.visitorPhone ?? "Not supplied"}</DetailRow>
                <DetailRow label="Interest">{selected.interest}</DetailRow>
                <DetailRow label="Inspection date">
                  {selected.preferredInspectionDate ?? "Pending operational confirmation"}
                </DetailRow>
                <DetailRow label="Inspection state">{selected.inspectionState}</DetailRow>
                <DetailRow label="Buyer interest">{selected.buyerInterestState}</DetailRow>
                <DetailRow label="Follow-up">{selected.followUpState}</DetailRow>
                <DetailRow label="Assigned staff">{selected.assignedStaffPlaceholder}</DetailRow>
                <DetailRow label="Document state">{selected.documentState}</DetailRow>
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
                  Assign locally
                </PreviewButton>
                <PreviewButton
                  icon={<CalendarPlus className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Propose inspection locally
                </PreviewButton>
                <PreviewButton
                  icon={<MessageSquarePlus className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Add note locally
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Close enquiry locally
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No enquiry selected">
              <p className="text-sm text-muted-foreground">Select a preview Stay & Own enquiry.</p>
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
