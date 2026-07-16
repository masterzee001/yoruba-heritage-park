import { createFileRoute } from "@tanstack/react-router";
import { ArchiveRestore, Pencil, Plus, RotateCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  AdminConfirmationDialog,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminModal,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  DetailRow,
  FilterChip,
  type AdminColumn,
} from "@/admin/components";
import {
  deleteAdminEvent,
  listAdminEvents,
  restoreAdminEvent,
  saveAdminEvent,
} from "@/admin/event-functions";
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
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);

  const loadEvents = useCallback(async () => {
    setError(null);
    const list = await listAdminEvents({
      data: { search, status, includeDeleted: includeArchived },
    });
    setRecords(list);
    setSelectedId((current) =>
      current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
    );
  }, [includeArchived, search, status]);

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

  async function handleArchive() {
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
        "Event archived. The record is hidden from active event lists and retained for audit and recovery.",
      );
      await loadEvents();
    } catch {
      setError("Event could not be archived.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore() {
    if (!selected) return;
    setNotice(null);
    const result = await restoreAdminEvent({ data: { id: selected.id } });
    setNotice(result.message);
    await loadEvents();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Programme operations"
        title="Events"
        description="Review database-backed event records, including the initial past event archive."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone="success">Database-backed</AdminStatusBadge>
            <button
              type="button"
              onClick={() => setModal("new")}
              className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:border-forest"
            >
              <Plus className="size-3.5" aria-hidden />
              New event
            </button>
          </div>
        }
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
        <label className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.currentTarget.checked)}
          />
          Include archived
        </label>
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
                <DetailRow label="Archive state">
                  {selected.deletedAt ? `Archived ${selected.deletedAt}` : "Active"}
                </DetailRow>
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
                Archiving an event hides it from active admin lists but retains the record for audit
                and recovery workflows.
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModal("edit")}
                  disabled={Boolean(selected.deletedAt)}
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-xs font-medium hover:border-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit event
                </button>
                {selected.deletedAt ? (
                  <button
                    type="button"
                    onClick={() => void handleRestore()}
                    className="inline-flex items-center gap-2 rounded-sm border border-forest/40 px-4 py-2 text-xs font-medium text-forest-deep hover:bg-forest/10"
                  >
                    <ArchiveRestore className="size-3.5" aria-hidden />
                    Restore event
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-sm border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Archive event
                  </button>
                )}
              </div>
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
        title="Archive this event?"
        description="The event will be hidden from active event lists. Audit history will be retained."
        confirmLabel={deleting ? "Archiving" : "Archive event"}
        destructive
        onConfirm={() => void handleArchive()}
      />
      <AdminModal
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
        title={modal === "edit" ? "Edit event" : "New event"}
        description="Event information can stay pending where operations are not confirmed."
      >
        <EventForm
          key={modal === "edit" ? (selected?.id ?? "edit") : "new"}
          event={modal === "edit" ? selected : null}
          onSubmit={async (input) => {
            const result = await saveAdminEvent({ data: input });
            setNotice(result.message);
            if (result.ok) {
              setModal(null);
              await loadEvents();
            }
          }}
        />
      </AdminModal>
    </>
  );
}

function EventForm({
  event,
  onSubmit,
}: {
  event: AdminEvent | null;
  onSubmit: (input: {
    id?: string;
    title: string;
    slug: string;
    category: string;
    startsAt: string;
    endsAt?: string | null;
    capacity?: number | null;
    status: EventStatus;
    featured: boolean;
    repeating: boolean;
    notes?: string | null;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [category, setCategory] = useState(event?.category ?? "");
  const [startsAt, setStartsAt] = useState(event?.startsAtInput ?? "");
  const [endsAt, setEndsAt] = useState(event?.endsAtInput ?? "");
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? "");
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "draft");
  const [featured, setFeatured] = useState(Boolean(event?.featured));
  const [repeating, setRepeating] = useState(Boolean(event?.repeating));
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (submitEvent) => {
        submitEvent.preventDefault();
        setSaving(true);
        try {
          await onSubmit({
            id: event?.id,
            title,
            slug,
            category,
            startsAt,
            endsAt: endsAt || null,
            capacity: capacity ? Number(capacity) : null,
            status,
            featured,
            repeating,
            notes,
          });
        } finally {
          setSaving(false);
        }
      }}
    >
      <EventInput label="Title" value={title} onChange={setTitle} />
      <EventInput
        label="Slug"
        value={slug}
        onChange={setSlug}
        placeholder="Generated from title if blank"
      />
      <EventInput label="Category" value={category} onChange={setCategory} />
      <EventInput label="Starts" type="datetime-local" value={startsAt} onChange={setStartsAt} />
      <EventInput label="Ends" type="datetime-local" value={endsAt} onChange={setEndsAt} />
      <EventInput label="Capacity" type="number" value={capacity} onChange={setCapacity} />
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Status
        <select
          className="rounded-sm border border-border px-3 py-2 text-sm text-foreground"
          value={status}
          onChange={(changeEvent) => setStatus(changeEvent.currentTarget.value as EventStatus)}
        >
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <EventCheckbox checked={featured} onChange={setFeatured}>
          Featured
        </EventCheckbox>
        <EventCheckbox checked={repeating} onChange={setRepeating}>
          Repeating
        </EventCheckbox>
      </div>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Notes
        <textarea
          className="min-h-24 rounded-sm border border-border px-3 py-2 text-sm text-foreground"
          value={notes}
          onChange={(changeEvent) => setNotes(changeEvent.currentTarget.value)}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-forest-deep px-4 py-2 text-sm text-ivory disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save event"}
      </button>
    </form>
  );
}

function EventInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm text-foreground"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function EventCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {children}
    </label>
  );
}
