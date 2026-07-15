import { createFileRoute } from "@tanstack/react-router";
import { RotateCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminConfirmationDialog,
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
import { deleteAdminEvent, listAdminEvents } from "@/admin/event-functions";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import type { AdminEvent, EventStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/events")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Events — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminEventsRoute,
});

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  appointment_only: "Appointment only",
};

const STATUS_TONE: Record<EventStatus, StatusTone> = {
  draft: "muted",
  published: "success",
  cancelled: "danger",
  appointment_only: "warning",
};

const columns: AdminColumn<AdminEvent>[] = [
  {
    key: "title",
    header: "Event",
    render: (row) => <span className="font-medium">{row.title}</span>,
  },
  { key: "starts", header: "Starts", render: (row) => row.startsAt },
  {
    key: "booked",
    header: "Booked",
    hideOnMobile: true,
    render: (row) => `${row.booked}/${row.capacity ?? "TBC"}`,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminEventsRoute() {
  const [records, setRecords] = useState<AdminEvent[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EventStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEvents = useCallback(async () => {
    setError(null);
    const list = await listAdminEvents({ data: { search, status } });
    setRecords(list);
    setSelectedId((current) =>
      current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
    );
  }, [search, status]);

  useEffect(() => {
    let cancelled = false;
    loadEvents().catch(() => {
      if (!cancelled) setError("Event records could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [loadEvents]);

  const selected = useMemo(
    () => records?.find((row) => row.id === selectedId) ?? null,
    [records, selectedId],
  );

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    setNotice(null);
    try {
      const result = await deleteAdminEvent({ data: { id: selected.id } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirmDelete(false);
      setNotice(
        "Event deleted. The record is hidden from active event lists and retained in audit history.",
      );
      await loadEvents();
    } catch {
      setError("Event could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Programme operations"
        title="Events"
        description="Review database-backed event records, including the initial past event archive."
        actions={<AdminStatusBadge tone="success">Database-backed</AdminStatusBadge>}
      />

      <AdminFilterBar>
        <AdminSearchInput
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className="min-w-[220px] flex-1"
        />
        {(["all", "draft", "published", "appointment_only", "cancelled"] as const).map((value) => (
          <FilterChip key={value} active={status === value} onClick={() => setStatus(value)}>
            {value === "all" ? "All" : STATUS_LABEL[value]}
          </FilterChip>
        ))}
        <button
          type="button"
          onClick={() => void loadEvents()}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:border-forest"
        >
          <RotateCw className="size-3.5" aria-hidden />
          Refresh
        </button>
      </AdminFilterBar>

      {notice ? (
        <div className="rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-sm text-forest-deep">
          {notice}
        </div>
      ) : null}

      {error ? (
        <AdminErrorState description={error} />
      ) : !records ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
          <AdminDataTable
            columns={columns}
            rows={records}
            rowKey={(row) => row.id}
            caption="Event administration records"
            emptyTitle="No events"
            emptyDescription="No event records match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />

          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.category}
              title={selected.title}
              actions={
                <AdminStatusBadge tone={STATUS_TONE[selected.status]}>
                  {STATUS_LABEL[selected.status]}
                </AdminStatusBadge>
              }
            >
              <dl>
                <DetailRow label="Slug">{selected.slug}</DetailRow>
                <DetailRow label="Starts">{selected.startsAt}</DetailRow>
                <DetailRow label="Ends">
                  {selected.endsAt ??
                    "Details will be published following operational confirmation."}
                </DetailRow>
                <DetailRow label="Capacity">
                  {selected.capacity ?? "Pending confirmation"}
                </DetailRow>
                <DetailRow label="Booked">{selected.booked}</DetailRow>
                <DetailRow label="Repeating">{selected.repeating ? "Yes" : "No"}</DetailRow>
                <DetailRow label="Notes">
                  {selected.notes ??
                    "Details will be published following operational confirmation."}
                </DetailRow>
              </dl>

              <div className="mt-6 rounded-sm border border-border bg-cream/30 px-4 py-3 text-xs text-muted-foreground">
                Deleting an event performs a soft delete. The record is removed from active admin
                lists but retained for audit and recovery workflows.
              </div>

              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="mt-5 inline-flex items-center gap-2 rounded-sm border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete event
              </button>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No event selected">
              <p className="text-sm text-muted-foreground">Select an event record to inspect it.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this event?"
        description="The event will be hidden from active event lists. Audit history will be retained."
        confirmLabel={deleting ? "Deleting" : "Delete event"}
        destructive
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
