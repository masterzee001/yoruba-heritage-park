import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
import type { ContentPage, ContentStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/content")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Content — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminContentRoute,
});

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

const STATUS_TONE: Record<ContentStatus, StatusTone> = {
  draft: "muted",
  in_review: "warning",
  approved: "info",
  published: "success",
  archived: "neutral",
};

const columns: AdminColumn<ContentPage>[] = [
  {
    key: "title",
    header: "Page",
    render: (row) => <span className="font-medium">{row.title}</span>,
  },
  { key: "slug", header: "Path", render: (row) => row.slug },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
  { key: "updated", header: "Updated", hideOnMobile: true, render: (row) => row.updatedAt },
];

function AdminContentRoute() {
  return (
    <AdminOperationPage
      eyebrow="Content operations"
      title="Pages & content"
      description="Review public page records and publication readiness without changing production content."
      loadRecords={(filters) => adminService.content.listPages(filters)}
      columns={columns}
      detailTitle={(row) => row.title}
      detailEyebrow={(row) => row.slug}
      detailRows={(row) => [
        { label: "Section", value: row.section },
        { label: "Status", value: STATUS_LABEL[row.status] },
        { label: "Updated by", value: row.updatedBy },
        { label: "Updated", value: row.updatedAt },
        { label: "Summary", value: row.summary },
        {
          label: "Review note",
          value: row.reviewNote ?? "Details will be published following operational confirmation.",
        },
      ]}
      status={(row) => row.status}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "draft", label: "Draft" },
        { value: "in_review", label: "In review" },
        { value: "published", label: "Published" },
      ]}
      disabledFeature="Production publishing"
      disabledReason="Content approval and production publishing are disabled until the backend and editorial workflow are connected."
      actionLabel="Preview content action"
    />
  );
}
