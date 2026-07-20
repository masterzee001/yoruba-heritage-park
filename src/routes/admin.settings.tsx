import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
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
} from "@/admin/components";
import { projectStatus } from "@/config/project-status";
import { getAdminSettingsSnapshot, saveAdminSetting } from "@/admin/governance-functions";
import type { AdminSettingsSnapshot } from "@/admin/types";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Settings — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettingsRoute,
});

const criticalFlags = [
  "bookingEnabled",
  "paymentEnabled",
  "authenticationEnabled",
  "emailEnabled",
  "smsEnabled",
  "whatsappEnabled",
  "ticketQrEnabled",
  "mediaUploadEnabled",
] as const;

function AdminSettingsRoute() {
  const [settings, setSettings] = useState<AdminSettingsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminSettingsSnapshot()
      .then((value) => !cancelled && setSettings(value))
      .catch(() => !cancelled && setError("Settings could not be loaded."));
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
        description="Manage approved text settings from MySQL. Critical launch flags remain environment-controlled."
        actions={<AdminStatusBadge tone="success">Operational settings</AdminStatusBadge>}
      />
      <FeatureDisabledNotice
        feature="Critical launch controls"
        reason="Environment variables, secrets, payment capture and live SOS activation remain locked outside the public admin UI."
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
            action={<AdminStatusBadge tone="success">MySQL-backed</AdminStatusBadge>}
          />
          <SettingEditor
            onSaved={async (message) => {
              setNotice(message);
              setSettings(await getAdminSettingsSnapshot());
            }}
          />
          <AdminSettingsSection title="Visitor information" values={settings.visitorInformation} />
          <AdminSettingsSection title="Booking" values={settings.booking} />
          <AdminSettingsSection title="Payments" values={settings.payments} />
          <AdminSettingsSection title="Notifications" values={settings.notifications} />
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

function SettingEditor({ onSaved }: { onSaved: (message: string) => Promise<void> }) {
  const [group, setGroup] = useState("general");
  const [key, setKey] = useState("operational_status");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-3 rounded-sm border border-border bg-background p-4 md:grid-cols-[160px_220px_minmax(0,1fr)_auto]"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
          const result = await saveAdminSetting({ data: { group, key, value } });
          await onSaved(result.message);
          if (result.ok) setValue("");
        } finally {
          setSaving(false);
        }
      }}
    >
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        value={group}
        onChange={(event) => setGroup(event.currentTarget.value)}
        aria-label="Setting group"
      />
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        value={key}
        onChange={(event) => setKey(event.currentTarget.value)}
        aria-label="Setting key"
      />
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        placeholder="Approved setting value"
        aria-label="Setting value"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-forest-deep px-4 py-2 text-sm text-ivory disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save setting"}
      </button>
    </form>
  );
}
