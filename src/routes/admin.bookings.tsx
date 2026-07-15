import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminBooking, BookingStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/bookings")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Bookings — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminBookingsRoute,
});

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  refund_requested: "Refund requested",
  refunded: "Refunded",
};

const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  pending: "warning",
  awaiting_payment: "warning",
  confirmed: "success",
  checked_in: "info",
  completed: "success",
  cancelled: "danger",
  refund_requested: "warning",
  refunded: "neutral",
};

const columns: AdminColumn<AdminBooking>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "visitor", header: "Visitor", render: (row) => row.visitorName },
  { key: "visit", header: "Visit date", render: (row) => row.visitDate },
  { key: "guests", header: "Guests", hideOnMobile: true, render: (row) => row.guests },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminBookingsRoute() {
  return (
    <AdminOperationPage
      eyebrow="Visitor operations"
      title="Bookings"
      description="Review booking requests and visitor attendance records in preview mode."
      loadRecords={(filters) => adminService.bookings.list(filters)}
      columns={columns}
      detailTitle={(row) => row.reference}
      detailEyebrow={(row) => row.visitorName}
      detailRows={(row) => [
        { label: "Visitor email", value: row.visitorEmail },
        {
          label: "Country of origin",
          value:
            row.countryOfOrigin ?? "Details will be published following operational confirmation.",
        },
        { label: "Booking type", value: row.bookingType },
        { label: "Visit date", value: row.visitDate },
        {
          label: "Duration of stay",
          value: row.durationOfStayDays
            ? `${row.durationOfStayDays} day${row.durationOfStayDays === 1 ? "" : "s"}`
            : "Pending confirmation",
        },
        { label: "Guests", value: row.guests },
        { label: "Payment state", value: row.paymentState },
        { label: "Checked in", value: row.checkedIn ? "Yes" : "No" },
        { label: "Source", value: row.source },
        {
          label: "Notes",
          value: row.notes ?? "Details will be published following operational confirmation.",
        },
      ]}
      status={(row) => row.status}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "awaiting_payment", label: "Awaiting payment" },
      ]}
      disabledFeature="Booking writes"
      disabledReason="Creating, confirming and cancelling bookings is disabled until the MySQL repository layer is implemented."
      actionLabel="Preview booking action"
    />
  );
}
