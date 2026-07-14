import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, MapPin, ShieldAlert, Ticket, User } from "lucide-react";
import {
  AdminDetailPanel,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminStatusBadge,
  DemoBadge,
  DetailRow,
  FeatureDisabledNotice,
  PreviewModeBanner,
} from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminSosAlert, SosStatus, StatusTone } from "@/admin/types";

export const Route = createFileRoute("/admin/sos")({
  head: () => ({
    meta: [
      { title: "SOS console — Administrator" },
      { name: "robots", content: "noindex" },
    ],
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

  return (
    <>
      <AdminPageHeader
        eyebrow="Safety operations"
        title="SOS console"
        description="Operational view for administrator preview only."
        actions={
          <AdminStatusBadge tone="danger">
            <ShieldAlert className="size-3" aria-hidden />
            Preview mode
          </AdminStatusBadge>
        }
      />

      <PreviewModeBanner
        variant="danger"
        message="SOS preview mode: no live emergency response is connected. Demonstration alerts must never be treated as real incidents."
      />

      {error ? (
        <AdminErrorState description={error} />
      ) : !alerts ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-sm border border-border bg-background">
            <div className="border-b border-border p-4 text-xs uppercase tracking-widest text-muted-foreground">
              Test queue
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
                        <span className="truncate font-medium text-forest-deep">
                          {a.reference}
                        </span>
                        <AdminStatusBadge tone={STATUS_TONE[a.status]}>
                          {STATUS_LABEL[a.status]}
                        </AdminStatusBadge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {a.category} · {a.locationLabel}
                      </span>
                      <div className="mt-1">
                        <DemoBadge />
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
              title={STATUS_LABEL[selected.status] + " · " + selected.category}
              actions={<DemoBadge />}
            >
              <dl>
                <DetailRow label="Visitor">{selected.visitorName ?? "—"}</DetailRow>
                <DetailRow label="Ticket reference">
                  {selected.ticketReference ?? "—"}
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
                <DetailRow label="Assigned responder">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" aria-hidden />
                    {selected.assignedResponder ?? "—"}
                  </span>
                </DetailRow>
              </dl>

              <div className="mt-6">
                <FeatureDisabledNotice
                  feature="Live emergency dispatch"
                  reason="Acknowledgement, responder assignment and status transitions are not connected in preview mode. Records shown are test data only."
                />
              </div>

              <div className="mt-6 aspect-[16/8] w-full overflow-hidden rounded-sm border border-border bg-[oklch(0.94_0.02_140)]">
                <div className="grid size-full place-items-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-3.5" aria-hidden /> Map placeholder — pending mapping integration
                  </span>
                </div>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel title="No alert selected" eyebrow="—">
              <p className="text-sm text-muted-foreground">
                Select a test record from the queue.
              </p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Ticket className="mr-1 inline size-3" aria-hidden />
        Ticket, visitor and GPS values shown are demonstration placeholders only.
      </p>
    </>
  );
}
