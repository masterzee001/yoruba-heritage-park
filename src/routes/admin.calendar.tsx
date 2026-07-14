import { createFileRoute } from "@tanstack/react-router";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminEvent, EventStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/calendar")({
  head: () => ({
    meta: [{ title: "Calendar — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCalendarRoute,
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
  { key: "date", header: "Date", render: (row) => row.startsAt },
  {
    key: "title",
    header: "Programme",
    render: (row) => <span className="font-medium">{row.title}</span>,
  },
  { key: "category", header: "Category", hideOnMobile: true, render: (row) => row.category },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminCalendarRoute() {
  return (
    <AdminOperationPage
      eyebrow="Programme operations"
      title="Calendar"
      description="Preview calendar view for programme scheduling records."
      loadRecords={(filters) => adminService.events.calendar(filters)}
      columns={columns}
      detailTitle={(row) => row.title}
      detailEyebrow={(row) => row.startsAt}
      detailRows={(row) => [
        { label: "Category", value: row.category },
        { label: "Status", value: STATUS_LABEL[row.status] },
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
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
        { value: "appointment_only", label: "Appointment only" },
      ]}
      disabledFeature="Calendar scheduling"
      disabledReason="Schedule changes are disabled until the production repository layer is connected."
      actionLabel="Preview calendar action"
    />
  );
}
