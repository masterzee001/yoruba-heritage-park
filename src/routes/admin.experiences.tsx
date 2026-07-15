import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminExperience, StatusTone } from "@/admin/types";

type ExperienceStatus = AdminExperience["status"];

export const Route = createFileRoute("/admin/experiences")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Experiences — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminExperiencesRoute,
});

const STATUS_LABEL: Record<ExperienceStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const STATUS_TONE: Record<ExperienceStatus, StatusTone> = {
  draft: "muted",
  published: "success",
  archived: "neutral",
};

const columns: AdminColumn<AdminExperience>[] = [
  {
    key: "title",
    header: "Experience",
    render: (row) => <span className="font-medium">{row.title}</span>,
  },
  { key: "category", header: "Category", render: (row) => row.category },
  {
    key: "availability",
    header: "Availability",
    hideOnMobile: true,
    render: (row) => row.availability,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminExperiencesRoute() {
  return (
    <AdminOperationPage
      eyebrow="Programme operations"
      title="Experiences"
      description="Maintain preview experience records and readiness notes."
      loadRecords={(filters) => adminService.experiences.list(filters)}
      columns={columns}
      detailTitle={(row) => row.title}
      detailEyebrow={(row) => row.category}
      detailRows={(row) => [
        { label: "Slug", value: row.slug },
        { label: "Duration", value: row.duration },
        { label: "Availability", value: row.availability },
        { label: "Booking type", value: row.bookingType },
        { label: "Featured", value: row.featured ? "Yes" : "No" },
        { label: "Summary", value: row.summary },
        {
          label: "Accessibility",
          value:
            row.accessibility ?? "Details will be published following operational confirmation.",
        },
      ]}
      status={(row) => row.status}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ]}
      disabledFeature="Experience publishing"
      disabledReason="Experience records are preview-only until repository writes and approval workflows are implemented."
      actionLabel="Preview experience action"
    />
  );
}
