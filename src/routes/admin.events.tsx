import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
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
  return (
    <AdminOperationPage
      eyebrow="Programme operations"
      title="Events"
      description="Inspect scheduled programme records and capacity placeholders."
      loadRecords={(filters) => adminService.events.list(filters)}
      columns={columns}
      detailTitle={(row) => row.title}
      detailEyebrow={(row) => row.category}
      detailRows={(row) => [
        { label: "Slug", value: row.slug },
        { label: "Starts", value: row.startsAt },
        {
          label: "Ends",
          value: row.endsAt ?? "Details will be published following operational confirmation.",
        },
        { label: "Capacity", value: row.capacity ?? "Pending confirmation" },
        { label: "Booked", value: row.booked },
        { label: "Repeating", value: row.repeating ? "Yes" : "No" },
        {
          label: "Notes",
          value: row.notes ?? "Details will be published following operational confirmation.",
        },
      ]}
      status={(row) => row.status}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "appointment_only", label: "Appointment only" },
      ]}
      disabledFeature="Event publishing"
      disabledReason="Event creation, edits and cancellations are local-preview only until backend writes are implemented."
      actionLabel="Preview event action"
    />
  );
}
