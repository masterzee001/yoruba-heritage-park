import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Copy, Mail, RotateCw, Save, XCircle } from "lucide-react";
import type { ReactNode } from "react";
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
  getAdminBookingPaymentHistory,
  listAdminBookings,
  saveAdminBookingNotes,
  type AdminBookingPaymentHistory,
  type AdminBookingPaymentHistoryPayment,
  updateAdminBookingWorkflow,
} from "@/admin/booking-functions";
import {
  prepareBookingPaymentLink,
  prepareBookingPaymentRequest,
  type PrepareBookingPaymentLinkResult,
} from "@/admin/payment-functions";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import type { AdminBooking, BookingStatus, StatusTone } from "@/admin/types";
import { supportedPaymentCurrencies } from "@/config/payment-currencies";

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
  const [paymentCurrency, setPaymentCurrency] = useState("NGN");
  const [paymentProvider, setPaymentProvider] = useState("paypal");
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [preparingPaymentLink, setPreparingPaymentLink] = useState(false);
  const [paymentLinkResult, setPaymentLinkResult] =
    useState<PrepareBookingPaymentLinkResult | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<AdminBookingPaymentHistory | null>(null);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setError(null);
    const list = await listAdminBookings({ data: { search, status } });
    setRecords(list);
    setSelectedId((current) =>
      current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
    );
  }, [search, status]);

  const loadPaymentHistory = useCallback(async (bookingId: string) => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryError(null);
    try {
      const history = await getAdminBookingPaymentHistory({ data: { bookingId } });
      if (!history.ok) {
        setPaymentHistory(null);
        setPaymentHistoryError(history.message ?? "Payment history could not be loaded.");
        return;
      }
      setPaymentHistory(history);
    } catch {
      setPaymentHistory(null);
      setPaymentHistoryError("Payment history could not be loaded.");
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, []);

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
    setPaymentCurrency(selected?.currency ?? "NGN");
    setPaymentLinkResult(null);
  }, [selected?.id, selected?.internalNotes, selected?.amountNgn, selected?.currency]);

  useEffect(() => {
    if (!selected?.id) {
      setPaymentHistory(null);
      setPaymentHistoryError(null);
      return;
    }
    void loadPaymentHistory(selected.id);
  }, [loadPaymentHistory, selected?.id]);

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
          currency: paymentCurrency,
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(result.message);
      await loadBookings();
      await loadPaymentHistory(selected.id);
    } catch {
      setError("Payment request could not be prepared.");
    } finally {
      setPreparingPayment(false);
    }
  }

  async function handlePreparePaymentLink() {
    if (!selected) return;
    const amountMinor = Math.round(Number(paymentAmount) * 100);
    setPreparingPaymentLink(true);
    setError(null);
    setNotice(null);
    setPaymentLinkResult(null);
    try {
      const result = await prepareBookingPaymentLink({
        data: {
          bookingId: selected.id,
          providerCode: paymentProvider,
          amountMinor,
          currency: paymentCurrency,
        },
      });
      setPaymentLinkResult(result);
      if (!result.ok) {
        setError(
          result.missingConfiguration?.length
            ? `${result.message} Missing: ${result.missingConfiguration.join(", ")}.`
            : result.message,
        );
        return;
      }
      setNotice(result.message);
      await loadBookings();
      await loadPaymentHistory(selected.id);
    } catch {
      setError("Payment link could not be prepared.");
    } finally {
      setPreparingPaymentLink(false);
    }
  }

  async function handleCopyPaymentLink() {
    if (!paymentLinkResult?.checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(paymentLinkResult.checkoutUrl);
      setNotice("Payment link copied.");
    } catch {
      setError("Payment link could not be copied by this browser.");
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
                    Prepare the approved request first, or prepare a provider checkout link for
                    manual sending after review. Payment is confirmed only by verified webhook
                    reconciliation.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1.5 text-sm font-medium text-charcoal">
                    Approved amount
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
                    Currency
                    <select
                      value={paymentCurrency}
                      onChange={(event) => setPaymentCurrency(event.currentTarget.value)}
                      className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-normal"
                    >
                      {supportedPaymentCurrencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-charcoal">
                    Provider
                    <select
                      value={paymentProvider}
                      onChange={(event) => setPaymentProvider(event.currentTarget.value)}
                      className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-normal"
                    >
                      <option value="paypal">PayPal</option>
                      <option value="paystack">Paystack</option>
                      <option value="stripe">Stripe</option>
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
                <button
                  type="button"
                  onClick={() => void handlePreparePaymentLink()}
                  disabled={
                    preparingPaymentLink ||
                    Boolean(actioning) ||
                    selected.status === "cancelled" ||
                    selected.status === "refunded"
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-sm bg-forest-deep px-4 py-2 text-xs font-medium text-ivory disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {preparingPaymentLink ? "Preparing link" : "Prepare checkout link"}
                </button>
                {paymentLinkResult?.ok && paymentLinkResult.checkoutUrl ? (
                  <div className="grid gap-3 rounded-sm border border-forest/20 bg-forest/10 p-3 text-xs">
                    <div>
                      <p className="font-medium text-forest-deep">Visitor payment link</p>
                      <code className="mt-1 block break-all rounded-sm border border-border bg-background px-2 py-1.5 text-muted-foreground">
                        {paymentLinkResult.checkoutUrl}
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopyPaymentLink()}
                        className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-forest"
                      >
                        <Copy className="size-3.5" aria-hidden />
                        Copy link
                      </button>
                      {paymentLinkResult.visitorEmail ? (
                        <a
                          href={buildPaymentLinkMailto(paymentLinkResult)}
                          className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-forest"
                        >
                          <Mail className="size-3.5" aria-hidden />
                          Open email draft
                        </a>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground">
                      Payment reference: {paymentLinkResult.paymentReference}. Do not mark payment
                      as received until provider verification is reconciled.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 rounded-sm border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Payment history</p>
                    <h3 className="mt-1 font-serif text-lg text-forest-deep">
                      Requests and reconciliation
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadPaymentHistory(selected.id)}
                    className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-xs font-medium hover:border-forest"
                  >
                    <RotateCw className="size-3.5" aria-hidden />
                    Refresh
                  </button>
                </div>

                {paymentHistoryLoading ? (
                  <p className="text-sm text-muted-foreground">Loading payment history.</p>
                ) : paymentHistoryError ? (
                  <p className="rounded-sm border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {paymentHistoryError}
                  </p>
                ) : !paymentHistory?.payments.length ? (
                  <p className="rounded-sm border border-border bg-cream/30 px-3 py-2 text-xs text-muted-foreground">
                    No payment request has been prepared for this booking yet.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {paymentHistory.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="grid gap-3 rounded-sm border border-border bg-cream/20 p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-charcoal">{payment.reference}</p>
                            <p className="mt-1 text-muted-foreground">
                              {payment.amountDisplay} via {formatToken(payment.providerCode)}
                            </p>
                          </div>
                          <AdminStatusBadge tone={paymentStatusTone(payment.status)}>
                            {paymentStatusLabel(payment.status)}
                          </AdminStatusBadge>
                        </div>
                        <dl className="grid gap-2 sm:grid-cols-2">
                          <PaymentHistoryDetail label="Provider reference">
                            {payment.providerTransactionReference ?? "Not captured"}
                          </PaymentHistoryDetail>
                          <PaymentHistoryDetail label="Verification">
                            {formatToken(payment.verificationStatus)}
                          </PaymentHistoryDetail>
                          <PaymentHistoryDetail label="Refund">
                            {formatToken(payment.refundStatus)}
                          </PaymentHistoryDetail>
                          <PaymentHistoryDetail label="Reconciled">
                            {payment.reconciliationApplied ? "Yes" : "No"}
                          </PaymentHistoryDetail>
                          <PaymentHistoryDetail label="Created">
                            {formatHistoryDate(payment.createdAt)}
                          </PaymentHistoryDetail>
                          <PaymentHistoryDetail label="Checkout mode">
                            {payment.checkoutUrl
                              ? payment.sandbox
                                ? "Sandbox link prepared"
                                : "Provider link prepared"
                              : "No checkout link"}
                          </PaymentHistoryDetail>
                        </dl>
                        {payment.checkoutUrl ? (
                          <a
                            href={payment.checkoutUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all rounded-sm border border-border bg-background px-2 py-1.5 font-medium text-forest-deep hover:border-forest"
                          >
                            {payment.checkoutUrl}
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {paymentHistory?.webhookEvents.length ? (
                  <div className="mt-2 grid gap-2 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Webhook events
                    </p>
                    {paymentHistory.webhookEvents.map((event) => (
                      <div
                        key={event.id}
                        className="grid gap-2 rounded-sm border border-border bg-background p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-charcoal">{event.eventType}</p>
                          <AdminStatusBadge
                            tone={event.statusMutationApplied ? "success" : "preview"}
                          >
                            {event.statusMutationApplied ? "Applied" : "No status change"}
                          </AdminStatusBadge>
                        </div>
                        <p className="text-muted-foreground">
                          {formatToken(event.providerCode)} event {event.providerEventId} for{" "}
                          {event.paymentReference ?? "unmatched payment"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <AdminStatusBadge
                            tone={event.processingStatus === "processed" ? "success" : "muted"}
                          >
                            {formatToken(event.processingStatus)}
                          </AdminStatusBadge>
                          <AdminStatusBadge
                            tone={event.verificationStatus === "verified" ? "success" : "preview"}
                          >
                            {formatToken(event.verificationStatus)}
                          </AdminStatusBadge>
                          <span className="text-muted-foreground">
                            Received {formatHistoryDate(event.receivedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
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

function buildPaymentLinkMailto(result: PrepareBookingPaymentLinkResult): string {
  const subject = `Yoruba Heritage Park payment link ${result.paymentReference ?? ""}`.trim();
  const body = [
    result.visitorName ? `Hello ${result.visitorName},` : "Hello,",
    "",
    "Your Yoruba Heritage Park payment link is ready:",
    result.checkoutUrl ?? "",
    "",
    result.bookingReference ? `Booking reference: ${result.bookingReference}` : null,
    result.paymentReference ? `Payment reference: ${result.paymentReference}` : null,
    "",
    "Payment is confirmed only after provider verification. Keep your reference for status checks.",
  ]
    .filter(Boolean)
    .join("\n");

  return `mailto:${encodeURIComponent(result.visitorEmail ?? "")}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

function PaymentHistoryDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-charcoal">{children}</dd>
    </div>
  );
}

function paymentStatusLabel(status: AdminBookingPaymentHistoryPayment["status"]): string {
  const labels: Record<AdminBookingPaymentHistoryPayment["status"], string> = {
    pending: "Pending",
    successful: "Successful Preview",
    failed: "Failed",
    abandoned: "Abandoned",
    reversed: "Reversed",
    refund_pending: "Refund Pending Preview",
    refunded: "Refunded Preview",
  };
  return labels[status];
}

function paymentStatusTone(status: AdminBookingPaymentHistoryPayment["status"]): StatusTone {
  const tones: Record<AdminBookingPaymentHistoryPayment["status"], StatusTone> = {
    pending: "warning",
    successful: "success",
    failed: "danger",
    abandoned: "muted",
    reversed: "neutral",
    refund_pending: "warning",
    refunded: "info",
  };
  return tones[status];
}

function formatToken(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatHistoryDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}
