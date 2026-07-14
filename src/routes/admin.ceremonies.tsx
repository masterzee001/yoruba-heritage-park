import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarPlus, CheckCircle2, ClipboardEdit, MessageSquarePlus } from "lucide-react";
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
  AdminCeremonyEnquiry,
  CeremonyFilters,
  CeremonyStatus,
  CeremonyType,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/ceremonies")({
  head: () => ({
    meta: [{ title: "Ceremonies — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCeremoniesRoute,
});

const STATUS_LABEL: Record<CeremonyStatus, string> = {
  new: "New",
  in_review: "In Review",
  awaiting_information: "Awaiting Information",
  date_proposed: "Date Proposed",
  proposal_preview: "Proposal Preview",
  scheduled_preview: "Scheduled Preview",
  completed_preview: "Completed Preview",
  cancelled: "Cancelled",
  closed: "Closed",
};

const STATUS_TONE: Record<CeremonyStatus, StatusTone> = {
  new: "warning",
  in_review: "info",
  awaiting_information: "warning",
  date_proposed: "info",
  proposal_preview: "preview",
  scheduled_preview: "success",
  completed_preview: "success",
  cancelled: "danger",
  closed: "neutral",
};

const TYPE_LABEL: Record<CeremonyType, string> = {
  naming_ceremony: "Naming ceremony",
  wedding: "Wedding",
  private_ceremony: "Private ceremony",
  cultural_celebration: "Cultural celebration",
  prayer_gathering: "Prayer gathering",
  other_approved: "Other approved occasion",
};

const columns: AdminColumn<AdminCeremonyEnquiry>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "contact", header: "Contact", render: (row) => row.contactName },
  {
    key: "type",
    header: "Type",
    hideOnMobile: true,
    render: (row) => TYPE_LABEL[row.ceremonyType],
  },
  { key: "date", header: "Preferred date", render: (row) => row.preferredDate ?? "Pending" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminCeremoniesRoute() {
  const [rows, setRows] = useState<AdminCeremonyEnquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CeremonyFilters>({ status: "all", ceremonyType: "all" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.ceremonies
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Ceremony enquiries could not be loaded."));
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
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Ceremonies" }]} />
      <AdminPageHeader
        eyebrow="Specialist operations"
        title="Ceremonies"
        description="Preview ceremony enquiry management without official confirmations, packages or pricing."
      />
      <PreviewModeBanner message="Ceremony proposal, date and status actions are preview-only. No ceremony is officially confirmed." />
      <FeatureDisabledNotice
        feature="Ceremony confirmation"
        reason="Packages, pricing, venue commitments and coordinator assignments are not connected in preview mode."
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
            "in_review",
            "awaiting_information",
            "date_proposed",
            "proposal_preview",
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
          value={filters.ceremonyType ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              ceremonyType: event.currentTarget.value as CeremonyFilters["ceremonyType"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Ceremony type"
        >
          <option value="all">All ceremony types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.preferredDate ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, preferredDate: event.currentTarget.value }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Preferred date"
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
            caption="Ceremony enquiry records"
            emptyTitle="No ceremony enquiries"
            emptyDescription="No preview ceremony enquiries match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={TYPE_LABEL[selected.ceremonyType]}
              title={selected.reference}
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
                <DetailRow label="Contact">{selected.contactName}</DetailRow>
                <DetailRow label="Email">{selected.contactEmail}</DetailRow>
                <DetailRow label="Preferred date">
                  {selected.preferredDate ?? "Pending operational confirmation"}
                </DetailRow>
                <DetailRow label="Guest estimate">
                  {selected.guestEstimate ?? "Pending operational confirmation"}
                </DetailRow>
                <DetailRow label="Venue preference">{selected.venuePreference}</DetailRow>
                <DetailRow label="Requirements">{selected.requirements}</DetailRow>
                <DetailRow label="Proposal state">{selected.proposalState}</DetailRow>
                <DetailRow label="Coordinator">{selected.assignedCoordinatorPlaceholder}</DetailRow>
                <DetailRow label="Internal notes">{selected.internalNotes}</DetailRow>
              </dl>
              <div className="mt-6">
                <AdminTimeline items={selected.timeline} />
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<ClipboardEdit className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Proposal preview
                </PreviewButton>
                <PreviewButton
                  icon={<CalendarPlus className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Date proposal preview
                </PreviewButton>
                <PreviewButton
                  icon={<MessageSquarePlus className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Internal note preview
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Status update preview
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No enquiry selected">
              <p className="text-sm text-muted-foreground">Select a preview ceremony enquiry.</p>
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
