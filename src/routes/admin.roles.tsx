import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState } from "react";
import {
  AdminBreadcrumbs,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPermissionMatrix,
  AdminStatusBadge,
  DetailRow,
  PermissionNotice,
  type AdminColumn,
} from "@/admin/components";
import { listAdminRoles } from "@/admin/governance-functions";
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
  { key: "count", header: "Assigned users", render: (row) => row.assignedUserCount },
  {
    key: "state",
    header: "State",
    render: () => <AdminStatusBadge tone="success">Operational</AdminStatusBadge>,
  },
];

function AdminRolesRoute() {
  const [rows, setRows] = useState<AdminRoleDefinition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAdminRoles()
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

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Roles" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Roles and permissions"
        description="Database-backed role definitions and server-side permission grants."
      />
      <PermissionNotice />
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
            caption="Administrator roles"
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.id}
              title={selected.label}
              actions={
                <>
                  <AdminStatusBadge tone="success">Server enforced</AdminStatusBadge>
                </>
              }
            >
              <dl>
                <DetailRow label="Description">{selected.description}</DetailRow>
                <DetailRow label="Assigned users">{selected.assignedUserCount}</DetailRow>
                <DetailRow label="Read-only state">
                  {selected.readOnly ? "System role" : "Editable role"}
                </DetailRow>
              </dl>
              <div className="mt-6">
                <AdminPermissionMatrix permissions={selected.permissions} />
              </div>
            </AdminDetailPanel>
          ) : null}
        </div>
      )}
    </>
  );
}
