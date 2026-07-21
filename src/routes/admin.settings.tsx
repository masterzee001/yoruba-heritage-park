import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useState } from "react";
import { CheckCircle2, Lock, MailCheck, Send } from "lucide-react";
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
import {
  getAdminSettingsSnapshot,
  runEmailDeliveryTest,
  saveAdminSetting,
} from "@/admin/governance-functions";
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
        feature="Provider-controlled capabilities"
        reason="Live SOS, SMS, WhatsApp, QR validation and media uploads remain unavailable until their required operational providers and approvals are configured."
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
          <EmailDeliveryTester
            onResult={async (message) => {
              setNotice(message);
              setSettings(await getAdminSettingsSnapshot());
            }}
            onError={setError}
          />
          <AdminSettingsSection title="Media" values={settings.media} />
          <AdminSettingsSection title="SEO" values={settings.seo} />
          <AdminSettingsSection title="Legal and privacy" values={settings.legalPrivacy} />
          <AdminSettingsSection
            title="Feature controls"
            description="Production capabilities are enabled only when their server-side dependencies are configured."
            values={flagValues}
            action={<Lock className="size-4 text-muted-foreground" aria-hidden />}
          />
        </div>
      )}
    </>
  );
}

function EmailDeliveryTester({
  onResult,
  onError,
}: {
  onResult: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [toEmail, setToEmail] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <section className="grid gap-4 rounded-sm border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Email delivery</p>
          <h2 className="mt-1 font-serif text-xl text-forest-deep">SMTP production test</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Verifies SMTP login from the server and sends one controlled test email. Leave the
            recipient blank to use the configured admin or sender address.
          </p>
        </div>
        <AdminStatusBadge tone="success">
          <MailCheck className="size-3.5" aria-hidden />
          SMTP
        </AdminStatusBadge>
      </div>
      <form
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={async (event) => {
          event.preventDefault();
          setSending(true);
          onError("");
          try {
            const result = await runEmailDeliveryTest({
              data: { toEmail: toEmail.trim() || undefined },
            });
            if (!result.ok) {
              onError(result.message);
              return;
            }
            await onResult(result.message);
          } catch {
            onError("SMTP test could not be completed from the production server.");
          } finally {
            setSending(false);
          }
        }}
      >
        <input
          type="email"
          value={toEmail}
          onChange={(event) => setToEmail(event.currentTarget.value)}
          placeholder="Optional test recipient"
          className="rounded-sm border border-border px-3 py-2 text-sm"
          aria-label="Optional email test recipient"
        />
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-forest-deep px-4 py-2 text-sm font-medium text-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden />
          {sending ? "Sending test" : "Run SMTP test"}
        </button>
      </form>
    </section>
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
