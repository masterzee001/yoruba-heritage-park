import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminSettingsSection,
  AdminStatusBadge,
  FeatureDisabledNotice,
  PreviewModeBanner,
} from "@/admin/components";
import { projectStatus } from "@/config/project-status";
import { adminService } from "@/admin/services";
import type { AdminSettingsSnapshot } from "@/admin/types";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettingsRoute,
});

const criticalFlags = [
  "bookingEnabled",
  "paymentEnabled",
  "sosLiveEnabled",
  "authenticationEnabled",
  "emailEnabled",
  "smsEnabled",
  "whatsappEnabled",
  "geolocationLiveEnabled",
  "ticketQrEnabled",
  "mediaUploadEnabled",
] as const;

function AdminSettingsRoute() {
  const [settings, setSettings] = useState<AdminSettingsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.settings
      .get()
      .then((value) => !cancelled && setSettings(value))
      .catch(() => !cancelled && setError("Settings preview could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, []);

  const flagValues = Object.fromEntries(
    criticalFlags.map((flag) => [flag, projectStatus[flag] ? "Enabled" : "Disabled and locked"]),
  );

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Settings" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Settings"
        description="Production feature controls are locked in preview mode. Enabling a visual toggle does not configure a secure backend service."
        actions={<AdminStatusBadge tone="preview">Preview settings</AdminStatusBadge>}
      />
      <PreviewModeBanner message="Production feature controls are locked in preview mode. Enabling a visual toggle does not configure a secure backend service." />
      <FeatureDisabledNotice
        feature="Production configuration"
        reason="Environment variables, secrets, credentials and backend feature activation are not exposed here."
      />
      {notice ? (
        <div className="flex items-start gap-3 rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-xs text-forest-deep">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{notice}</p>
        </div>
      ) : null}
      {error ? (
        <AdminErrorState description={error} />
      ) : !settings ? (
        <AdminLoadingState rows={4} />
      ) : (
        <div className="grid gap-4">
          <AdminSettingsSection
            title="General"
            values={settings.general}
            action={
              <PreviewSave
                onClick={() =>
                  setNotice("Preview action completed locally. No production record was created.")
                }
              />
            }
          />
          <AdminSettingsSection title="Visitor information" values={settings.visitorInformation} />
          <AdminSettingsSection title="Booking" values={settings.booking} />
          <AdminSettingsSection title="Payments" values={settings.payments} />
          <AdminSettingsSection title="Notifications" values={settings.notifications} />
          <AdminSettingsSection title="Safety" values={settings.safety} />
          <AdminSettingsSection title="Media" values={settings.media} />
          <AdminSettingsSection title="SEO" values={settings.seo} />
          <AdminSettingsSection title="Legal and privacy" values={settings.legalPrivacy} />
          <AdminSettingsSection
            title="Feature controls"
            description="Critical production flags remain false and locked."
            values={flagValues}
            action={<Lock className="size-4 text-muted-foreground" aria-hidden />}
          />
        </div>
      )}
    </>
  );
}

function PreviewSave({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-border px-3 py-2 text-xs font-medium"
    >
      Save preview locally
    </button>
  );
}
