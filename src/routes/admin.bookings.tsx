import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, RotateCw, Save, XCircle } from "lucide-react";
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
import {
  listAdminBookings,
  saveAdminBookingNotes,
  updateAdminBookingWorkflow,
} from "@/admin/booking-functions";
import { prepareBookingPaymentRequest } from "@/admin/payment-functions";
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
  const [notice, setNotice] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [actioning, setActioning] = useState<"confirm" | "cancel" | "complete" | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("paypal");
  const [preparingPayment, setPreparingPayment] = useState(false);

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

  useEffect(() => {
    setInternalNotes(selected?.internalNotes ?? "");
    setPaymentAmount(selected?.amountNgn ? String(selected.amountNgn) : "");
  }, [selected?.id, selected?.internalNotes, selected?.amountNgn]);

  function replaceRecord(booking: AdminBooking) {
    setRecords((current) => current?.map((row) => (row.id === booking.id ? booking : row)) ?? null);
    setSelectedId(booking.id);
  }

  async function handleWorkflowAction(action: "confirm" | "cancel" | "complete") {
    if (!selected) return;
    setActioning(action);
    setError(null);
    setNotice(null);
    try {
      const result = await updateAdminBookingWorkflow({
        data: { id: selected.id, action, internalNotes },
      });
      if (!result.ok || !result.booking) {
        setError(result.message);
        return;
      }
      replaceRecord(result.booking);
      setNotice(result.message);
    } catch {
      setError("Booking workflow action could not be completed.");
    } finally {
      setActioning(null);
    }
  }

  async function handleSaveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    setError(null);
    setNotice(null);
    try {
      const result = await saveAdminBookingNotes({
        data: { id: selected.id, internalNotes },
      });
      if (!result.ok || !result.booking) {
        setError(result.message);
        return;
      }
      replaceRecord(result.booking);
      setNotice(result.message);
    } catch {
      setError("Internal booking notes could not be saved.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handlePreparePaymentRequest() {
    if (!selected) return;
    const amountMinor = Math.round(Number(paymentAmount) * 100);
    setPreparingPayment(true);
    setError(null);
    setNotice(null);
    try {
      const result = await prepareBookingPaymentRequest({
        data: {
          bookingId: selected.id,
          providerCode: paymentProvider,
          amountMinor,
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(result.message);
      await loadBookings();
    } catch {
      setError("Payment request could not be prepared.");
    } finally {
      setPreparingPayment(false);
    }
  }

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

      {notice ? (
        <div className="rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-sm text-forest-deep">
          {notice}
        </div>
      ) : null}

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

              <div className="mt-6 grid gap-3 rounded-sm border border-border bg-background p-4">
                <div>
                  <p className="eyebrow">Payment request</p>
                  <h3 className="mt-1 font-serif text-lg text-forest-deep">
                    Prepare admin-reviewed payment
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Creates a pending internal payment record only. No checkout link, charge, or
                    provider transaction is created.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium text-charcoal">
                    Approved amount NGN
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.currentTarget.value)}
                      className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-normal"
                      placeholder="Enter approved amount"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-charcoal">
                    Provider
                    <select
                      value={paymentProvider}
                      onChange={(event) => setPaymentProvider(event.currentTarget.value)}
                      className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-normal"
                    >
                      <option value="paypal">PayPal</option>
                      <option value="pending_configuration">Pending configuration</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handlePreparePaymentRequest()}
                  disabled={
                    preparingPayment ||
                    Boolean(actioning) ||
                    selected.status === "cancelled" ||
                    selected.status === "refunded"
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-sm border border-brass/40 px-4 py-2 text-xs font-medium text-forest-deep hover:bg-brass/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {preparingPayment ? "Preparing request" : "Prepare payment request"}
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-charcoal">
                  Internal admin notes
                  <textarea
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.currentTarget.value)}
                    rows={4}
                    className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-normal"
                    placeholder="Add operational follow-up notes for administrators."
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleSaveNotes()}
                  disabled={savingNotes || Boolean(actioning)}
                  className="inline-flex w-fit items-center gap-2 rounded-sm border border-border px-4 py-2 text-xs font-medium hover:border-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="size-3.5" aria-hidden />
                  {savingNotes ? "Saving notes" : "Save notes"}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => void handleWorkflowAction("confirm")}
                  disabled={Boolean(actioning) || selected.status === "confirmed"}
                  className="inline-flex items-center gap-2 rounded-sm border border-forest/30 px-4 py-2 text-xs font-medium text-forest-deep hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {actioning === "confirm" ? "Confirming" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleWorkflowAction("complete")}
                  disabled={Boolean(actioning) || selected.status === "completed"}
                  className="inline-flex items-center gap-2 rounded-sm border border-brass/40 px-4 py-2 text-xs font-medium text-forest-deep hover:bg-brass/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ClipboardCheck className="size-3.5" aria-hidden />
                  {actioning === "complete" ? "Completing" : "Mark completed"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleWorkflowAction("cancel")}
                  disabled={Boolean(actioning) || selected.status === "cancelled"}
                  className="inline-flex items-center gap-2 rounded-sm border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="size-3.5" aria-hidden />
                  {actioning === "cancel" ? "Cancelling" : "Cancel"}
                </button>
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
