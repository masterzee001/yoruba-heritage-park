import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Copy, Grid2X2, List, Pencil, Trash2, Upload } from "lucide-react";
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
  PendingBadge,
  DetailRow,
  FeatureDisabledNotice,
  FilterChip,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { projectStatus } from "@/config/project-status";
import { cn } from "@/lib/utils";
import { adminService } from "@/admin/services";
import type {
  AdminMediaAsset,
  MediaFilters,
  MediaReviewState,
  MediaType,
  MediaUsage,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/media")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Media Library — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminMediaRoute,
});

const TYPE_LABEL: Record<MediaType, string> = {
  image: "Image",
  document: "Document",
  audio: "Audio",
  video_placeholder: "Video Pending",
};

const USAGE_LABEL: Record<MediaUsage, string> = {
  homepage: "Homepage",
  experience: "Experience",
  learning: "Learning",
  admin: "Admin",
  unused: "Unused",
};

const REVIEW_LABEL: Record<MediaReviewState, string> = {
  pending_review: "Pending review",
  approved_preview: "Approved",
  not_yet_published: "Not yet published",
};

const REVIEW_TONE: Record<MediaReviewState, StatusTone> = {
  pending_review: "warning",
  approved_preview: "success",
  not_yet_published: "muted",
};

const columns: AdminColumn<AdminMediaAsset>[] = [
  {
    key: "file",
    header: "File",
    render: (row) => <span className="font-medium">{row.fileNamePlaceholder}</span>,
  },
  { key: "type", header: "Type", render: (row) => TYPE_LABEL[row.mediaType] },
  {
    key: "usage",
    header: "Usage",
    hideOnMobile: true,
    render: (row) => row.usage.map((u) => USAGE_LABEL[u]).join(", "),
  },
  {
    key: "review",
    header: "Review",
    render: (row) => (
      <AdminStatusBadge tone={REVIEW_TONE[row.reviewState]}>
        {REVIEW_LABEL[row.reviewState]}
      </AdminStatusBadge>
    ),
  },
];

function AdminMediaRoute() {
  const [rows, setRows] = useState<AdminMediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<MediaFilters>({ mediaType: "all", usage: "all" });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService.media
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Media assets could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const selected = useMemo(
    () => rows?.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );
  const completePreviewAction = () =>
    setNotice("Action completed locally. No production record was created.");

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Media library" }]} />
      <AdminPageHeader
        eyebrow="Content operations"
        title="Media library"
        description="Media metadata management. Upload and file storage are pending operational setup."
      />
      <PreviewModeBanner message="Media upload and file storage are pending operational setup." />
      <FeatureDisabledNotice
        feature="Media upload and file storage"
        reason={
          projectStatus.mediaUploadEnabled
            ? undefined
            : "Real uploads, deletions, cloud storage, download URLs and filesystem writes are disabled."
        }
      />

      <AdminFilterBar>
        <AdminSearchInput
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.currentTarget.value }))
          }
          className="min-w-[220px] flex-1"
        />
        {(["all", "image", "document", "audio", "video_placeholder"] as const).map((mediaType) => (
          <FilterChip
            key={mediaType}
            active={(filters.mediaType ?? "all") === mediaType}
            onClick={() => setFilters((current) => ({ ...current, mediaType }))}
          >
            {mediaType === "all" ? "All types" : TYPE_LABEL[mediaType]}
          </FilterChip>
        ))}
        <select
          value={filters.usage ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              usage: event.currentTarget.value as MediaFilters["usage"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Usage"
        >
          <option value="all">All usage</option>
          {Object.entries(USAGE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-sm border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "grid size-8 place-items-center rounded-sm",
              view === "grid" && "bg-cream",
            )}
            aria-label="Grid view"
          >
            <Grid2X2 className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "grid size-8 place-items-center rounded-sm",
              view === "list" && "bg-cream",
            )}
            aria-label="List view"
          >
            <List className="size-4" aria-hidden />
          </button>
        </div>
      </AdminFilterBar>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}

      {error ? (
        <AdminErrorState description={error} />
      ) : !rows ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
          {view === "list" ? (
            <AdminDataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              caption="Media records"
              emptyTitle="No media assets"
              emptyDescription="No media assets match the selected filters."
              onRowClick={(row) => setSelectedId(row.id)}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.length === 0 ? (
                <div className="rounded-sm border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                  No media assets match the selected filters.
                </div>
              ) : (
                rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      "min-h-[180px] rounded-sm border border-border bg-background p-4 text-left transition hover:border-forest",
                      selectedId === row.id && "border-forest bg-cream/40",
                    )}
                  >
                    <div className="grid aspect-video place-items-center rounded-sm border border-dashed border-border bg-cream/50 text-xs text-muted-foreground">
                      {TYPE_LABEL[row.mediaType]}
                    </div>
                    <p className="mt-3 truncate text-sm font-medium text-forest-deep">
                      {row.fileNamePlaceholder}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{row.caption}</p>
                    <div className="mt-3">
                      <AdminStatusBadge tone={REVIEW_TONE[row.reviewState]}>
                        {REVIEW_LABEL[row.reviewState]}
                      </AdminStatusBadge>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {selected ? (
            <AdminDetailPanel
              eyebrow={TYPE_LABEL[selected.mediaType]}
              title={selected.fileNamePlaceholder}
              actions={
                <>
                  <AdminStatusBadge tone={REVIEW_TONE[selected.reviewState]}>
                    {REVIEW_LABEL[selected.reviewState]}
                  </AdminStatusBadge>
                  <PendingBadge />
                </>
              }
            >
              <dl>
                <DetailRow label="Media type">{TYPE_LABEL[selected.mediaType]}</DetailRow>
                <DetailRow label="Dimensions">{selected.dimensions ?? "Not applicable"}</DetailRow>
                <DetailRow label="File size">{selected.fileSize}</DetailRow>
                <DetailRow label="Alt text">{selected.altText}</DetailRow>
                <DetailRow label="Caption">{selected.caption}</DetailRow>
                <DetailRow label="Usage">
                  {selected.usage.map((u) => USAGE_LABEL[u]).join(", ")}
                </DetailRow>
                <DetailRow label="Created">{selected.createdAt}</DetailRow>
                <DetailRow label="Review state">{REVIEW_LABEL[selected.reviewState]}</DetailRow>
              </dl>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Select file locally
                </PreviewButton>
                <PreviewButton
                  icon={<Pencil className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Edit metadata locally
                </PreviewButton>
                <PreviewButton
                  icon={<Upload className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Replace file
                </PreviewButton>
                <PreviewButton icon={<Copy className="size-3.5" />} onClick={completePreviewAction}>
                  Copy reference
                </PreviewButton>
                <PreviewButton
                  icon={<Upload className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Upload form
                </PreviewButton>
                <PreviewButton
                  icon={<Trash2 className="size-3.5" />}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete record
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No media selected">
              <p className="text-sm text-muted-foreground">Select a media asset.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete media record?"
        description="This does not delete a real file. It only confirms the local workflow."
        confirmLabel="Delete locally"
        destructive
        onConfirm={() => {
          setDeleteOpen(false);
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
