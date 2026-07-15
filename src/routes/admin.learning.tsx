import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, FilePlus2, Pencil, Upload } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminConfirmationDialog,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminField,
  AdminFormSection,
  AdminLoadingState,
  AdminModal,
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
  AdminLearningResource,
  LearningAudience,
  LearningFilters,
  LearningResourceType,
  LearningStatus,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/learning")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Learning Hub — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLearningRoute,
});

const STATUS_LABEL: Record<LearningStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  published_preview: "Published Preview",
  archived: "Archived",
};

const STATUS_TONE: Record<LearningStatus, StatusTone> = {
  draft: "muted",
  in_review: "warning",
  approved: "info",
  published_preview: "success",
  archived: "neutral",
};

const TYPE_LABEL: Record<LearningResourceType, string> = {
  article: "Article",
  pdf_resource: "PDF resource",
  audio_guide: "Audio guide",
  teacher_resource: "Teacher resource",
  school_group_guide: "School-group guide",
  research_note: "Research note",
};

const AUDIENCE_LABEL: Record<LearningAudience, string> = {
  general: "General",
  teachers: "Teachers",
  students: "Students",
  researchers: "Researchers",
  families: "Families",
};

const columns: AdminColumn<AdminLearningResource>[] = [
  {
    key: "title",
    header: "Resource",
    render: (row) => <span className="font-medium">{row.title}</span>,
  },
  { key: "type", header: "Type", render: (row) => TYPE_LABEL[row.type] },
  {
    key: "audience",
    header: "Audience",
    hideOnMobile: true,
    render: (row) => AUDIENCE_LABEL[row.audience],
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminLearningRoute() {
  const [rows, setRows] = useState<AdminLearningResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<LearningFilters>({
    status: "all",
    type: "all",
    audience: "all",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"new" | "edit" | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService.learning
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Learning resources could not be loaded."));
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
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Learning hub" }]} />
      <AdminPageHeader
        eyebrow="Programme content"
        title="Learning hub"
        description="Manage preview learning resources without publishing real educational files."
        actions={
          <button
            type="button"
            onClick={() => setFormMode("new")}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium"
          >
            <FilePlus2 className="size-3.5" aria-hidden />
            New-resource preview
          </button>
        }
      />
      <PreviewModeBanner message="Resource publishing and file storage are not connected in preview mode." />
      <FeatureDisabledNotice
        feature="Resource publishing and file storage"
        reason="No real uploads, downloads or public learning resources are created from this interface."
      />

      <AdminFilterBar>
        <AdminSearchInput
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.currentTarget.value }))
          }
          className="min-w-[220px] flex-1"
        />
        {(["all", "draft", "in_review", "approved", "published_preview", "archived"] as const).map(
          (status) => (
            <FilterChip
              key={status}
              active={(filters.status ?? "all") === status}
              onClick={() => setFilters((current) => ({ ...current, status }))}
            >
              {status === "all" ? "All" : STATUS_LABEL[status]}
            </FilterChip>
          ),
        )}
        <select
          value={filters.type ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              type: event.currentTarget.value as LearningFilters["type"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Resource type"
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filters.audience ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              audience: event.currentTarget.value as LearningFilters["audience"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Audience"
        >
          <option value="all">All audiences</option>
          {Object.entries(AUDIENCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
            caption="Learning resource records"
            emptyTitle="No learning resources"
            emptyDescription="No preview resources match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={TYPE_LABEL[selected.type]}
              title={selected.title}
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
                <DetailRow label="Audience">{AUDIENCE_LABEL[selected.audience]}</DetailRow>
                <DetailRow label="Category">{selected.category}</DetailRow>
                <DetailRow label="Description">{selected.description}</DetailRow>
                <DetailRow label="Featured">{selected.featured ? "Yes" : "No"}</DetailRow>
                <DetailRow label="Access level">{selected.accessLevel}</DetailRow>
                <DetailRow label="File placeholder">
                  {selected.filePlaceholder ?? "Not connected"}
                </DetailRow>
                <DetailRow label="Audio placeholder">
                  {selected.audioPlaceholder ?? "Not connected"}
                </DetailRow>
                <DetailRow label="Review state">{selected.reviewState}</DetailRow>
              </dl>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => setFormMode("edit")}
                >
                  Edit preview form
                </PreviewButton>
                <PreviewButton
                  icon={<Upload className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  File-selection placeholder
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Publish preview
                </PreviewButton>
                <PreviewButton
                  icon={<Archive className="size-3.5" />}
                  onClick={() => setArchiveOpen(true)}
                >
                  Archive confirmation
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No resource selected">
              <p className="text-sm text-muted-foreground">Select a learning resource.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminModal
        open={formMode !== null}
        onOpenChange={(open) => !open && setFormMode(null)}
        title={formMode === "edit" ? "Edit preview resource" : "New-resource preview"}
        description="This form is a preview only. No resource is uploaded, published or stored."
      >
        <AdminFormSection title="Resource details" description="Awaiting authorised content.">
          <AdminField label="Resource title">
            <input
              className="rounded-sm border border-border px-3 py-2 text-sm"
              placeholder="Awaiting authorised content"
            />
          </AdminField>
          <AdminField label="File placeholder">
            <input
              className="rounded-sm border border-border px-3 py-2 text-sm"
              value="File storage not connected"
              readOnly
            />
          </AdminField>
          <button
            type="button"
            onClick={() => {
              setFormMode(null);
              completePreviewAction();
            }}
            className="rounded-sm bg-forest-deep px-4 py-2 text-sm text-ivory"
          >
            Save preview locally
          </button>
        </AdminFormSection>
      </AdminModal>

      <AdminConfirmationDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive preview resource?"
        description="This will only update local interface state for the current session."
        confirmLabel="Archive locally"
        onConfirm={() => {
          setArchiveOpen(false);
          completePreviewAction();
        }}
      />
    </>
  );
}

function PreviewNotice({ children }: { children: React.ReactNode }) {
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
  children: React.ReactNode;
  icon: React.ReactNode;
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
