import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, RotateCcw, SearchCheck } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTimeline,
  DemoBadge,
  DetailRow,
  FeatureDisabledNotice,
  FilterChip,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { projectStatus } from "@/config/project-status";
import { adminService } from "@/admin/services";
import type { AdminPayment, PaymentFilters, PaymentStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/payments")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Payments — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPaymentsRoute,
});

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  successful: "Successful Preview",
  failed: "Failed",
  abandoned: "Abandoned",
  reversed: "Reversed",
  refund_pending: "Refund Pending Preview",
  refunded: "Refunded Preview",
};

const STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  pending: "warning",
  successful: "success",
  failed: "danger",
  abandoned: "muted",
  reversed: "neutral",
  refund_pending: "warning",
  refunded: "info",
};

const columns: AdminColumn<AdminPayment>[] = [
  {
    key: "reference",
    header: "Reference",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "visitor", header: "Visitor", render: (row) => row.visitorName },
  { key: "amount", header: "Amount", render: (row) => `${row.currency} ${row.amountNgn}` },
  { key: "provider", header: "Provider", hideOnMobile: true, render: (row) => row.provider },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminPaymentsRoute() {
  const [rows, setRows] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({ status: "all" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.payments
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("Payment records could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const selected = useMemo(
    () => rows?.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );
  const completePreviewAction = () =>
    setNotice("Preview action completed locally. No production record was created.");

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Payments" }]} />
      <AdminPageHeader
        eyebrow="Commercial operations"
        title="Payments"
        description="Preview payment review records. Payment processing is not enabled in preview mode."
        actions={<AdminStatusBadge tone="preview">Payments disabled</AdminStatusBadge>}
      />
      <PreviewModeBanner message="Payment processing is not enabled in preview mode. No provider, verification endpoint, refund processor or card storage is connected." />
      <FeatureDisabledNotice
        feature="Payment processing"
        reason={
          projectStatus.paymentEnabled
            ? undefined
            : "Paystack, Flutterwave, Stripe and refund processing are not connected."
        }
      />

      <AdminFilterBar>
        <AdminSearchInput
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.currentTarget.value }))
          }
          className="min-w-[220px] flex-1"
        />
        {(["all", "pending", "successful", "failed", "refund_pending"] as const).map((status) => (
          <FilterChip
            key={status}
            active={(filters.status ?? "all") === status}
            onClick={() => setFilters((current) => ({ ...current, status }))}
          >
            {status === "all" ? "All" : STATUS_LABEL[status]}
          </FilterChip>
        ))}
        <select
          value={filters.verificationStatus ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              verificationStatus: event.currentTarget.value as PaymentFilters["verificationStatus"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Verification status"
        >
          <option value="all">All verification</option>
          <option value="not_applicable">Not applicable</option>
          <option value="unverified">Unverified</option>
          <option value="review_required">Review required</option>
          <option value="preview_verified">Preview verified</option>
        </select>
        <select
          value={filters.provider ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              provider: event.currentTarget.value as PaymentFilters["provider"],
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Provider"
        >
          <option value="all">All providers</option>
          <option value="pending_configuration">Pending configuration</option>
        </select>
        <input
          type="date"
          value={filters.date ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, date: event.currentTarget.value }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Payment date"
        />
      </AdminFilterBar>

      {notice ? (
        <div className="flex items-start gap-3 rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-xs text-forest-deep">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{notice}</p>
        </div>
      ) : null}

      {error ? (
        <AdminErrorState description={error} />
      ) : !rows ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
          <AdminDataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            caption="Payment administration records"
            emptyTitle="No payment records"
            emptyDescription="No preview payments match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.bookingReference}
              title={selected.reference}
              actions={
                <>
                  <AdminStatusBadge tone={STATUS_TONE[selected.status]}>
                    {STATUS_LABEL[selected.status]}
                  </AdminStatusBadge>
                  <DemoBadge />
                </>
              }
            >
              <dl>
                <DetailRow label="Related booking">{selected.relatedBookingType}</DetailRow>
                <DetailRow label="Visitor">{selected.visitorName}</DetailRow>
                <DetailRow label="Amount">{`${selected.currency} ${selected.amountNgn}`}</DetailRow>
                <DetailRow label="Provider">{selected.provider}</DetailRow>
                <DetailRow label="Transaction reference">
                  {selected.transactionReferencePlaceholder}
                </DetailRow>
                <DetailRow label="Verification state">{selected.verificationStatus}</DetailRow>
                <DetailRow label="Refund state">{selected.refundStatus}</DetailRow>
              </dl>
              <div className="mt-6">
                <AdminTimeline
                  items={selected.activity.map((item) => ({
                    id: item.id,
                    time: item.time,
                    title: item.title,
                    detail: item.detail,
                  }))}
                />
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <PreviewButton
                  icon={<SearchCheck className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Request verification preview
                </PreviewButton>
                <PreviewButton
                  icon={<RotateCcw className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Refund-review preview
                </PreviewButton>
                <PreviewButton
                  icon={<CreditCard className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Mark for review locally
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No payment selected">
              <p className="text-sm text-muted-foreground">Select a preview payment record.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}
    </>
  );
}

function PreviewButton({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:border-forest"
    >
      {icon}
      {children}
    </button>
  );
}
