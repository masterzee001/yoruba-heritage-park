import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Copy, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPermissionMatrix,
  AdminStatusBadge,
  DemoBadge,
  DetailRow,
  FeatureDisabledNotice,
  PermissionNotice,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { adminService } from "@/admin/services";
import type { AdminRoleDefinition } from "@/admin/types";

export const Route = createFileRoute("/admin/roles")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Roles — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminRolesRoute,
});

const columns: AdminColumn<AdminRoleDefinition>[] = [
  {
    key: "role",
    header: "Role",
    render: (row) => <span className="font-medium">{row.label}</span>,
  },
  { key: "count", header: "Assigned demo users", render: (row) => row.assignedUserCount },
  {
    key: "state",
    header: "State",
    render: () => <AdminStatusBadge tone="preview">Read-only preview</AdminStatusBadge>,
  },
];

function AdminRolesRoute() {
  const [rows, setRows] = useState<AdminRoleDefinition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService.roles
      .list()
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch(() => !cancelled && setError("Role records could not be loaded."));
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

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Roles" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Roles and permissions"
        description="Permission matrix preview for future server-side authorisation."
      />
      <PreviewModeBanner message="This permissions matrix is a user-interface preview only. Real authorisation must be enforced by the production server." />
      <PermissionNotice />
      <FeatureDisabledNotice
        feature="Role enforcement"
        reason="Routes and actions are not secured by this preview matrix. Production enforcement must happen server-side."
      />
      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
      {error ? (
        <AdminErrorState description={error} />
      ) : !rows ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
          <AdminDataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            caption="Role preview records"
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.id}
              title={selected.label}
              actions={
                <>
                  <AdminStatusBadge tone="preview">Read-only</AdminStatusBadge>
                  <DemoBadge />
                </>
              }
            >
              <dl>
                <DetailRow label="Description">{selected.description}</DetailRow>
                <DetailRow label="Assigned users">{selected.assignedUserCount}</DetailRow>
                <DetailRow label="Read-only state">
                  {selected.readOnly ? "Locked preview role" : "Editable preview"}
                </DetailRow>
              </dl>
              <div className="mt-6">
                <AdminPermissionMatrix permissions={selected.permissions} />
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton icon={<Copy className="size-3.5" />} onClick={completePreviewAction}>
                  Duplicate-role preview
                </PreviewButton>
                <PreviewButton
                  icon={<SlidersHorizontal className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Edit-role preview
                </PreviewButton>
                <PreviewButton
                  icon={<SlidersHorizontal className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Permission-change preview
                </PreviewButton>
                <PreviewButton
                  icon={<RotateCcw className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Restore-default preview
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : null}
        </div>
      )}
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
