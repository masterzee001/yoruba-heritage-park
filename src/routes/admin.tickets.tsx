import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { projectStatus } from "@/config/project-status";
import { adminService } from "@/admin/services";
import type { AdminTicket, StatusTone } from "@/admin/types";

type TicketStatus = AdminTicket["checkInStatus"];

export const Route = createFileRoute("/admin/tickets")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Tickets — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminTicketsRoute,
});

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: "Pending",
  checked_in: "Checked in",
  no_show: "No show",
};

const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  pending: "warning",
  checked_in: "success",
  no_show: "muted",
};

const columns: AdminColumn<AdminTicket>[] = [
  {
    key: "reference",
    header: "Ticket",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "holder", header: "Holder", render: (row) => row.holderName },
  { key: "visit", header: "Visit date", render: (row) => row.visitDate },
  { key: "qr", header: "QR", hideOnMobile: true, render: (row) => row.qrStatus },
  {
    key: "status",
    header: "Check-in",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.checkInStatus]}>
        {STATUS_LABEL[row.checkInStatus]}
      </AdminStatusBadge>
    ),
  },
];

function AdminTicketsRoute() {
  return (
    <AdminOperationPage
      eyebrow="Visitor operations"
      title="Tickets & check-in"
      description="Inspect ticket records while QR issuance and validation remain disabled."
      loadRecords={({ search, status }) =>
        adminService.tickets.list({ search, checkInStatus: status })
      }
      columns={columns}
      detailTitle={(row) => row.reference}
      detailEyebrow={(row) => row.bookingReference}
      detailRows={(row) => [
        { label: "Holder", value: row.holderName },
        { label: "Ticket type", value: row.ticketType },
        { label: "Visit date", value: row.visitDate },
        {
          label: "QR status",
          value: projectStatus.ticketQrEnabled
            ? row.qrStatus
            : "QR validation disabled in preview mode",
        },
        { label: "Check-in status", value: STATUS_LABEL[row.checkInStatus] },
        { label: "Checked in at", value: row.checkedInAt ?? "Not checked in" },
        {
          label: "Assigned staff",
          value:
            row.assignedStaff ?? "Details will be published following operational confirmation.",
        },
      ]}
      status={(row) => row.checkInStatus}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "checked_in", label: "Checked in" },
        { value: "no_show", label: "No show" },
      ]}
      disabledFeature="Ticket QR validation"
      disabledReason="No ticket QR code is issued or validated while ticketQrEnabled is false."
      actionLabel="Preview check-in action"
    />
  );
}
