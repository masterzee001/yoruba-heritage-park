import { createFileRoute } from "@tanstack/react-router";
import { RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  DetailRow,
  FilterChip,
  type AdminColumn,
} from "@/admin/components";
import { listAdminBookings } from "@/admin/booking-functions";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
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
  const [records, setRecords] = useState<AdminBooking[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setError(null);
    const list = await listAdminBookings({ data: { search, status } });
    setRecords(list);
    setSelectedId((current) =>
      current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
    );
  }, [search, status]);

  useEffect(() => {
    let cancelled = false;
    loadBookings().catch(() => {
      if (!cancelled) setError("Booking records could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [loadBookings]);

  const selected = useMemo(
    () => records?.find((row) => row.id === selectedId) ?? null,
    [records, selectedId],
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Visitor operations"
        title="Bookings"
        description="Review website booking requests and visitor attendance records."
        actions={<AdminStatusBadge tone="success">Database-backed</AdminStatusBadge>}
      />

      <AdminFilterBar>
        <AdminSearchInput
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className="min-w-[220px] flex-1"
        />
        {(["all", "pending", "awaiting_payment", "confirmed", "completed"] as const).map(
          (value) => (
            <FilterChip key={value} active={status === value} onClick={() => setStatus(value)}>
              {value === "all" ? "All" : STATUS_LABEL[value]}
            </FilterChip>
          ),
        )}
        <button
          type="button"
          onClick={() => void loadBookings()}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:border-forest"
        >
          <RotateCw className="size-3.5" aria-hidden />
          Refresh
        </button>
      </AdminFilterBar>

      {error ? (
        <AdminErrorState description={error} />
      ) : !records ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
          <AdminDataTable
            columns={columns}
            rows={records}
            rowKey={(row) => row.id}
            caption="Booking administration records"
            emptyTitle="No booking requests"
            emptyDescription="No website booking requests match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />

          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.visitorName}
              title={selected.reference}
              actions={
                <AdminStatusBadge tone={STATUS_TONE[selected.status]}>
                  {STATUS_LABEL[selected.status]}
                </AdminStatusBadge>
              }
            >
              <dl>
                <DetailRow label="Visitor email">{selected.visitorEmail}</DetailRow>
                <DetailRow label="Country of origin">
                  {selected.countryOfOrigin ??
                    "Details will be published following operational confirmation."}
                </DetailRow>
                <DetailRow label="Booking type">{selected.bookingType}</DetailRow>
                <DetailRow label="Visit date">{selected.visitDate}</DetailRow>
                <DetailRow label="Duration of stay">
                  {selected.durationOfStayDays
                    ? `${selected.durationOfStayDays} day${
                        selected.durationOfStayDays === 1 ? "" : "s"
                      }`
                    : "Pending confirmation"}
                </DetailRow>
                <DetailRow label="Guests">{selected.guests}</DetailRow>
                <DetailRow label="Payment state">{selected.paymentState}</DetailRow>
                <DetailRow label="Checked in">{selected.checkedIn ? "Yes" : "No"}</DetailRow>
                <DetailRow label="Source">{selected.source}</DetailRow>
                <DetailRow label="Created">{selected.createdAt}</DetailRow>
                <DetailRow label="Notes">
                  {selected.notes ??
                    "Details will be published following operational confirmation."}
                </DetailRow>
              </dl>

              <div className="mt-6 rounded-sm border border-border bg-cream/30 px-4 py-3 text-xs text-muted-foreground">
                Payment remains separate from booking intake. Requests should be reviewed before
                confirmation or payment collection.
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No booking selected">
              <p className="text-sm text-muted-foreground">
                Select a booking request to inspect its administrative detail.
              </p>
            </AdminDetailPanel>
          )}
        </div>
      )}
    </>
  );
}
