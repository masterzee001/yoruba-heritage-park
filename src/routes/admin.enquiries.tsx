import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { AdminOperationPage, AdminStatusBadge, type AdminColumn } from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminEnquiry, EnquiryStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/enquiries")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Enquiries — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminEnquiriesRoute,
});

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_review: "In review",
  awaiting_visitor: "Awaiting visitor",
  scheduled: "Scheduled",
  resolved: "Resolved",
  closed: "Closed",
  spam: "Spam",
};

const STATUS_TONE: Record<EnquiryStatus, StatusTone> = {
  new: "warning",
  assigned: "info",
  in_review: "warning",
  awaiting_visitor: "warning",
  scheduled: "success",
  resolved: "success",
  closed: "neutral",
  spam: "danger",
};

const columns: AdminColumn<AdminEnquiry>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "contact", header: "Contact", render: (row) => row.contactName },
  { key: "category", header: "Category", hideOnMobile: true, render: (row) => row.category },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminEnquiriesRoute() {
  return (
    <AdminOperationPage
      eyebrow="Visitor operations"
      title="Enquiries"
      description="Review public enquiries and assignment state without sending outbound messages."
      loadRecords={(filters) => adminService.enquiries.list(filters)}
      columns={columns}
      detailTitle={(row) => row.reference}
      detailEyebrow={(row) => row.contactName}
      detailRows={(row) => [
        { label: "Email", value: row.contactEmail },
        { label: "Phone", value: row.contactPhone ?? "Not supplied" },
        { label: "Category", value: row.category },
        { label: "Priority", value: row.priority },
        { label: "Assigned to", value: row.assignedTo ?? "Unassigned" },
        { label: "Proposed date", value: row.proposedDate ?? "Not supplied" },
        { label: "Message", value: row.message },
      ]}
      status={(row) => row.status}
      statusMap={{ labels: STATUS_LABEL, tones: STATUS_TONE }}
      statusOptions={[
        { value: "all", label: "All" },
        { value: "new", label: "New" },
        { value: "assigned", label: "Assigned" },
        { value: "in_review", label: "In review" },
        { value: "scheduled", label: "Scheduled" },
      ]}
      disabledFeature="Outbound visitor messaging"
      disabledReason="Email, SMS and WhatsApp responses are disabled until production communication services are connected."
      actionLabel="Record enquiry action"
    />
  );
}
