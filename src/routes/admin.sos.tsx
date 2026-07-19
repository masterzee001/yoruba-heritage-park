import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { projectStatus } from "@/config/project-status";
import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Clock,
  FilePlus2,
  MapPin,
  MessageSquarePlus,
  ShieldAlert,
  Ticket,
  User,
} from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminDetailPanel,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTimeline,
  PendingBadge,
  DetailRow,
  FeatureDisabledNotice,
  PreviewModeBanner,
} from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminSosAlert, SosStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/sos")({
  beforeLoad: ({ location }) => {
    if (!projectStatus.sosLiveEnabled) throw redirect({ to: "/admin" });
    return requireAdminRouteAccess(location);
  },
  head: () => ({
    meta: [{ title: "SOS Console — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSosConsole,
});

const STATUS_LABEL: Record<SosStatus, string> = {
  test: "Test",
  new: "New",
  acknowledged: "Acknowledged",
  responding: "Responding",
  resolved: "Resolved",
  false_alarm: "False alarm",
  closed: "Closed",
};

const STATUS_TONE: Record<SosStatus, StatusTone> = {
  test: "preview",
  new: "danger",
  acknowledged: "warning",
  responding: "info",
  resolved: "success",
  false_alarm: "muted",
  closed: "muted",
};

function AdminSosConsole() {
  const [alerts, setAlerts] = useState<AdminSosAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.sos
      .list()
      .then((list) => {
        if (cancelled) return;
        setAlerts(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch(() => !cancelled && setError("SOS records could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = alerts?.find((a) => a.id === selectedId) ?? null;
  const completePreviewAction = () =>
    setNotice("Action completed locally. No production record was created.");

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "SOS console" }]} />
      <AdminPageHeader
        eyebrow="Safety operations"
        title="SOS console"
        description="SOS is not approved for live operations. No emergency response workflow is connected."
        actions={
          <AdminStatusBadge tone="danger">
            <ShieldAlert className="size-3" aria-hidden />
            Test alerts only
          </AdminStatusBadge>
        }
      />

      <PreviewModeBanner
        variant="danger"
        message="SOS is not approved for live operations. No emergency response workflow is connected."
      />
      <FeatureDisabledNotice
        feature="Live SOS dispatch, geolocation and notifications"
        reason="No browser geolocation, mapping API, emergency API, SMS, email or WhatsApp service is connected."
      />

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}

      {error ? (
        <AdminErrorState description={error} />
      ) : !alerts ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-sm border border-border bg-background">
            <div className="border-b border-border p-4 text-xs uppercase tracking-widest text-muted-foreground">
              Test alert queue
            </div>
            <ul>
              {alerts.map((a) => {
                const active = a.id === selectedId;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={`flex w-full flex-col gap-1 border-b border-border p-4 text-left text-sm transition ${
                        active ? "bg-cream" : "hover:bg-cream/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-forest-deep">{a.reference}</span>
                        <AdminStatusBadge tone={STATUS_TONE[a.status]}>
                          {STATUS_LABEL[a.status]}
                        </AdminStatusBadge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {a.category} — {a.locationLabel}
                      </span>
                      <div className="mt-1">
                        <PendingBadge />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {selected ? (
            <AdminDetailPanel
              eyebrow={`Alert ${selected.reference}`}
              title={`${STATUS_LABEL[selected.status]} — ${selected.category}`}
              actions={<PendingBadge />}
            >
              <dl>
                <DetailRow label="Visitor">
                  {selected.visitorName ?? "Visitor details pending"}
                </DetailRow>
                <DetailRow label="Ticket reference">
                  {selected.ticketReference ?? "Ticket details pending"}
                </DetailRow>
                <DetailRow label="Location label">{selected.locationLabel}</DetailRow>
                <DetailRow label="Latitude">{selected.latitudePlaceholder}</DetailRow>
                <DetailRow label="Longitude">{selected.longitudePlaceholder}</DetailRow>
                <DetailRow label="Accuracy">{selected.accuracyPlaceholder}</DetailRow>
                <DetailRow label="Received">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" aria-hidden /> {selected.receivedAt}
                  </span>
                </DetailRow>
                <DetailRow label="Acknowledgement">
                  {selected.acknowledgedAt ?? "Acknowledgement pending"}
                </DetailRow>
                <DetailRow label="Assigned responder">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" aria-hidden />
                    {selected.assignedResponder ?? "Responder pending"}
                  </span>
                </DetailRow>
                <DetailRow label="Response notes">
                  {selected.responseNotes ?? "Response note pending"}
                </DetailRow>
                <DetailRow label="Resolution">{selected.resolutionPlaceholder}</DetailRow>
                <DetailRow label="Related incident">{selected.relatedIncidentReference}</DetailRow>
              </dl>

              <div className="mt-6">
                <AdminTimeline items={selected.timeline} />
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<ShieldAlert className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Acknowledge test alert locally
                </PreviewButton>
                <PreviewButton icon={<User className="size-3.5" />} onClick={completePreviewAction}>
                  Assign responder after setup
                </PreviewButton>
                <PreviewButton
                  icon={<MessageSquarePlus className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Add response note locally
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Mark responding locally
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Resolve test alert locally
                </PreviewButton>
                <PreviewButton
                  icon={<FilePlus2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Create related incident locally
                </PreviewButton>
              </div>

              <div className="mt-6 aspect-[16/8] w-full overflow-hidden rounded-sm border border-border bg-[oklch(0.94_0.02_140)]">
                <div className="grid size-full place-items-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-3.5" aria-hidden /> Map pending setup integration
                  </span>
                </div>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel title="No alert selected" eyebrow="Selection">
              <p className="text-sm text-muted-foreground">Select a test record from the queue.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Ticket className="mr-1 inline size-3" aria-hidden />
        Ticket, visitor and GPS values are pending operational connection.
      </p>
    </>
  );
}

function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-xs text-forest-deep">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

function PreviewButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
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
