import { createFileRoute } from "@tanstack/react-router";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminAppointment, AppointmentStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({
    meta: [{ title: "Appointments — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAppointmentsRoute,
});

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested: "Requested",
  scheduled: "Scheduled",
  awaiting_visitor: "Awaiting visitor",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  requested: "warning",
  scheduled: "success",
  awaiting_visitor: "warning",
  completed: "success",
  cancelled: "danger",
};

const columns: AdminColumn<AdminAppointment>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "visitor", header: "Visitor", render: (row) => row.visitorName },
  { key: "requested", header: "Requested", render: (row) => row.requestedDate },
  { key: "category", header: "Category", hideOnMobile: true, render: (row) => row.category },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminAppointmentsRoute() {
  return (
    <AdminOperationPage
      eyebrow="Visitor operations"
      title="Appointments"
      description="Preview appointment requests and scheduling state."
      loadRecords={(filters) => adminService.appointments.list(filters)}
      columns={columns}
      detailTitle={(row) => row.reference}
      detailEyebrow={(row) => row.visitorName}
      detailRows={(row) => [
        { label: "Email", value: row.visitorEmail },
        { label: "Category", value: row.category },
        { label: "Requested date", value: row.requestedDate },
        {
          label: "Scheduled for",
          value:
            row.scheduledFor ?? "Details will be published following operational confirmation.",
        },
        { label: "Assigned to", value: row.assignedTo ?? "Unassigned" },
        { label: "Created", value: row.createdAt },
        {
          label: "Notes",
          value: row.notes ?? "Details will be published following operational confirmation.",
        },
      ]}
      status={(row) => row.status}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "requested", label: "Requested" },
        { value: "scheduled", label: "Scheduled" },
        { value: "awaiting_visitor", label: "Awaiting visitor" },
        { value: "completed", label: "Completed" },
      ]}
      disabledFeature="Appointment scheduling"
      disabledReason="Scheduling changes are local preview actions until booking and appointment repositories are implemented."
      actionLabel="Preview appointment action"
    />
  );
}
