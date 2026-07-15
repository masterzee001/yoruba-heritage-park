import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import {
  listAdminPayments,
  listDonationCampaigns,
  listPaymentProviderSettings,
  saveDonationCampaign,
  savePaymentProviderSettings,
  type AdminDonationCampaign,
  type AdminPaymentProviderSettings,
} from "@/admin/payment-functions";
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
  const [providers, setProviders] = useState<AdminPaymentProviderSettings[] | null>(null);
  const [campaigns, setCampaigns] = useState<AdminDonationCampaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({ status: "all" });
  const [notice, setNotice] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({
    providerCode: "paypal",
    displayName: "PayPal",
    mode: "test" as "test" | "live",
    enabled: false,
    publicKey: "",
    secretReference: "PAYPAL_SECRET_KEY",
    currency: "NGN",
    minimumAmountMinor: 0,
  });
  const [campaignForm, setCampaignForm] = useState({
    campaignCode: "heritage-support",
    title: "Heritage Support",
    description:
      "Donation campaign setup for future approved fundraising. Public payment collection remains inactive.",
    status: "draft" as AdminDonationCampaign["status"],
    suggestedAmounts: "5000, 10000, 25000",
  });
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listAdminPayments({ data: filters })
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

  useEffect(() => {
    let cancelled = false;
    listPaymentProviderSettings()
      .then((list) => !cancelled && setProviders(list))
      .catch(() => !cancelled && setError("Payment provider settings could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listDonationCampaigns()
      .then((list) => !cancelled && setCampaigns(list))
      .catch(() => !cancelled && setError("Donation campaigns could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => rows?.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );
  const completePreviewAction = () =>
    setNotice("Preview action completed locally. No production record was created.");

  async function handleSaveProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProvider(true);
    setNotice(null);
    try {
      const result = await savePaymentProviderSettings({ data: providerForm });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setProviders(await listPaymentProviderSettings());
      setNotice(result.message);
    } catch {
      setError("Payment provider settings could not be saved.");
    } finally {
      setSavingProvider(false);
    }
  }

  async function handleSaveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCampaign(true);
    setNotice(null);
    try {
      const result = await saveDonationCampaign({
        data: {
          campaignCode: campaignForm.campaignCode,
          title: campaignForm.title,
          description: campaignForm.description,
          status: campaignForm.status,
          suggestedAmountsMinor: parseSuggestedAmounts(campaignForm.suggestedAmounts),
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCampaigns(await listDonationCampaigns());
      setNotice(result.message);
    } catch {
      setError("Donation campaign could not be saved.");
    } finally {
      setSavingCampaign(false);
    }
  }

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
            : "Provider configuration can be prepared here, but live capture remains off until operational approval."
        }
      />

      <section className="grid gap-4 rounded-sm border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Provider configuration</p>
            <h2 className="mt-1 font-serif text-xl text-forest-deep">
              Donation and payment providers
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Configure provider metadata and server-side secret references. Raw secret keys should
              stay in environment variables, not in browser-visible settings.
            </p>
          </div>
          <AdminStatusBadge tone={projectStatus.paymentEnabled ? "warning" : "preview"}>
            {projectStatus.paymentEnabled ? "Configuration mode" : "Live capture off"}
          </AdminStatusBadge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
          <form className="grid gap-3" onSubmit={handleSaveProvider}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProviderInput
                label="Provider code"
                value={providerForm.providerCode}
                onChange={(value) =>
                  setProviderForm((current) => ({ ...current, providerCode: value }))
                }
              />
              <ProviderInput
                label="Display name"
                value={providerForm.displayName}
                onChange={(value) =>
                  setProviderForm((current) => ({ ...current, displayName: value }))
                }
              />
              <label className="grid gap-1.5 text-sm font-medium">
                Mode
                <select
                  value={providerForm.mode}
                  onChange={(event) =>
                    setProviderForm((current) => ({
                      ...current,
                      mode: event.currentTarget.value as "test" | "live",
                    }))
                  }
                  className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="test">Test</option>
                  <option value="live">Live</option>
                </select>
              </label>
              <ProviderInput
                label="Currency"
                value={providerForm.currency}
                onChange={(value) =>
                  setProviderForm((current) => ({ ...current, currency: value }))
                }
              />
              <ProviderInput
                label="Public key"
                value={providerForm.publicKey}
                onChange={(value) =>
                  setProviderForm((current) => ({ ...current, publicKey: value }))
                }
              />
              <ProviderInput
                label="Secret env reference"
                value={providerForm.secretReference}
                onChange={(value) =>
                  setProviderForm((current) => ({ ...current, secretReference: value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={providerForm.enabled}
                onChange={(event) =>
                  setProviderForm((current) => ({
                    ...current,
                    enabled: event.currentTarget.checked,
                  }))
                }
              />
              Enable provider for future payment flows
            </label>
            <button
              type="submit"
              disabled={savingProvider}
              className="w-fit rounded-sm bg-forest-deep px-4 py-2 text-sm font-medium text-ivory disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProvider ? "Saving provider" : "Save provider settings"}
            </button>
          </form>

          <div className="rounded-sm border border-border bg-cream/30 p-4">
            <h3 className="font-serif text-lg text-forest-deep">Configured providers</h3>
            {!providers ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading provider settings...</p>
            ) : providers.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No providers configured.</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {providers.map((provider) => (
                  <li
                    key={provider.id}
                    className="rounded-sm border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{provider.displayName}</span>
                      <AdminStatusBadge tone={provider.enabled ? "success" : "muted"}>
                        {provider.enabled ? "Enabled" : "Disabled"}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {provider.providerCode} · {provider.mode} · {provider.currency}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Secret reference: {provider.secretReference ?? "Not set"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Donation setup</p>
            <h2 className="mt-1 font-serif text-xl text-forest-deep">
              Campaign forms and suggested amounts
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Prepare donation campaign metadata in the style of a giving plugin. Public donation
              forms and payment capture remain inactive until provider integration is approved.
            </p>
          </div>
          <AdminStatusBadge tone="preview">Capture off</AdminStatusBadge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
          <form className="grid gap-3" onSubmit={handleSaveCampaign}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProviderInput
                label="Campaign code"
                value={campaignForm.campaignCode}
                onChange={(value) =>
                  setCampaignForm((current) => ({ ...current, campaignCode: value }))
                }
              />
              <ProviderInput
                label="Campaign title"
                value={campaignForm.title}
                onChange={(value) => setCampaignForm((current) => ({ ...current, title: value }))}
              />
              <label className="grid gap-1.5 text-sm font-medium">
                Status
                <select
                  value={campaignForm.status}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      status: event.currentTarget.value as AdminDonationCampaign["status"],
                    }))
                  }
                  className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <ProviderInput
                label="Suggested amounts"
                value={campaignForm.suggestedAmounts}
                onChange={(value) =>
                  setCampaignForm((current) => ({ ...current, suggestedAmounts: value }))
                }
              />
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              Description
              <textarea
                value={campaignForm.description}
                onChange={(event) =>
                  setCampaignForm((current) => ({
                    ...current,
                    description: event.currentTarget.value,
                  }))
                }
                rows={3}
                className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={savingCampaign}
              className="w-fit rounded-sm bg-forest-deep px-4 py-2 text-sm font-medium text-ivory disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCampaign ? "Saving campaign" : "Save campaign"}
            </button>
          </form>

          <div className="rounded-sm border border-border bg-cream/30 p-4">
            <h3 className="font-serif text-lg text-forest-deep">Configured campaigns</h3>
            {!campaigns ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No campaigns configured.</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {campaigns.map((campaign) => (
                  <li
                    key={campaign.id}
                    className="rounded-sm border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{campaign.title}</span>
                      <AdminStatusBadge tone={campaign.status === "active" ? "warning" : "muted"}>
                        {campaign.status}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{campaign.campaignCode}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Suggested:{" "}
                      {campaign.suggestedAmountsMinor.length
                        ? campaign.suggestedAmountsMinor
                            .map((amount) => `NGN ${amount / 100}`)
                            .join(", ")
                        : "Pending"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

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
          <option value="paypal">PayPal</option>
          <option value="paystack">Paystack</option>
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

function parseSuggestedAmounts(value: string): number[] {
  return value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((amount) => Number.isFinite(amount) && amount > 0)
    .map((amount) => Math.round(amount * 100));
}

function ProviderInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
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
