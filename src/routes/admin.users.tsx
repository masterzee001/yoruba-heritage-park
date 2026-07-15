import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "@/admin/require-admin-route-access";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, KeyRound, UserPlus, UserX } from "lucide-react";
import {
  AdminBreadcrumbs,
  AdminConfirmationDialog,
  AdminDataTable,
  AdminDetailPanel,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminModal,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  DemoBadge,
  DetailRow,
  FeatureDisabledNotice,
  FilterChip,
  PermissionNotice,
  PreviewModeBanner,
  type AdminColumn,
} from "@/admin/components";
import { ADMIN_ROLE_LABELS } from "@/admin/types";
import { adminService } from "@/admin/services";
import type {
  AdminRole,
  AdminUser,
  AdminUserFilters,
  AdminUserStatus,
  StatusTone,
} from "@/admin/types";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: ({ location }) => requireAdminRouteAccess(location),
  head: () => ({
    meta: [{ title: "Users — Administrator" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsersRoute,
});

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  invited: "Invitation Preview",
  active: "Active Preview",
  suspended: "Suspended Preview",
};

const STATUS_TONE: Record<AdminUserStatus, StatusTone> = {
  invited: "warning",
  active: "success",
  suspended: "danger",
};

const columns: AdminColumn<AdminUser>[] = [
  {
    key: "ref",
    header: "User",
    render: (row) => <span className="font-medium">{row.reference}</span>,
  },
  { key: "name", header: "Display name", render: (row) => row.name },
  { key: "role", header: "Role", hideOnMobile: true, render: (row) => ADMIN_ROLE_LABELS[row.role] },
  {
    key: "status",
    header: "State",
    render: (row) => (
      <AdminStatusBadge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</AdminStatusBadge>
    ),
  },
];

function AdminUsersRoute() {
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminUserFilters>({
    role: "all",
    status: "all",
    invitationState: "all",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService.users
      .list(filters)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => !cancelled && setError("User records could not be loaded."));
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
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Users" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Users"
        description="User management is operating in preview mode. Authentication and account changes are not connected."
        actions={
          <PreviewButton icon={<UserPlus className="size-3.5" />} onClick={() => setModal("new")}>
            New-user invitation preview
          </PreviewButton>
        }
      />
      <PreviewModeBanner message="User management is operating in preview mode. Authentication and account changes are not connected." />
      <PermissionNotice />
      <FeatureDisabledNotice
        feature="Authentication, invitations and password resets"
        reason="No real users, sessions, invitations, passwords or resets are created."
      />

      <AdminFilterBar>
        <AdminSearchInput
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, search: event.currentTarget.value }))
          }
          className="min-w-[220px] flex-1"
        />
        {(["all", "invited", "active", "suspended"] as const).map((status) => (
          <FilterChip
            key={status}
            active={(filters.status ?? "all") === status}
            onClick={() => setFilters((current) => ({ ...current, status }))}
          >
            {status === "all" ? "All" : STATUS_LABEL[status]}
          </FilterChip>
        ))}
        <select
          value={filters.role ?? "all"}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              role: event.currentTarget.value as AdminRole | "all",
            }))
          }
          className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          aria-label="Role"
        >
          <option value="all">All roles</option>
          {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </AdminFilterBar>

      {notice ? <PreviewNotice>{notice}</PreviewNotice> : null}
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
            caption="User preview records"
            emptyTitle="No users"
            emptyDescription="No preview users match the selected filters."
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {selected ? (
            <AdminDetailPanel
              eyebrow={selected.reference}
              title={selected.name}
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
                <DetailRow label="Email">{selected.email}</DetailRow>
                <DetailRow label="Role">{ADMIN_ROLE_LABELS[selected.role]}</DetailRow>
                <DetailRow label="Invitation state">{selected.invitationState}</DetailRow>
                <DetailRow label="Last activity">
                  {selected.lastActiveAt ?? "No preview activity"}
                </DetailRow>
                <DetailRow label="Created">{selected.createdAt}</DetailRow>
                <DetailRow label="Read-only">{selected.readOnly ? "Yes" : "No"}</DetailRow>
                <DetailRow label="Suspension state">{selected.suspensionState}</DetailRow>
              </dl>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <PreviewButton
                  icon={<UserPlus className="size-3.5" />}
                  onClick={() => setModal("edit")}
                >
                  Edit-user preview form
                </PreviewButton>
                <PreviewButton
                  icon={<KeyRound className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Role-assignment preview
                </PreviewButton>
                <PreviewButton
                  icon={<KeyRound className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Password-reset preview notice
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={completePreviewAction}
                >
                  Restore preview
                </PreviewButton>
                <PreviewButton
                  icon={<UserX className="size-3.5" />}
                  onClick={() => setSuspendOpen(true)}
                >
                  Suspend confirmation preview
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No user selected">
              <p className="text-sm text-muted-foreground">Select a preview user.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminModal
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
        title={modal === "edit" ? "Edit-user preview" : "New-user invitation preview"}
        description="No invitation, account or session is created."
      >
        <div className="grid gap-3">
          <input
            className="rounded-sm border border-border px-3 py-2 text-sm"
            placeholder="Display name placeholder"
          />
          <input
            className="rounded-sm border border-border px-3 py-2 text-sm"
            placeholder="email@example.test"
          />
          <button
            type="button"
            onClick={() => {
              setModal(null);
              completePreviewAction();
            }}
            className="rounded-sm bg-forest-deep px-4 py-2 text-sm text-ivory"
          >
            Save preview locally
          </button>
        </div>
      </AdminModal>
      <AdminConfirmationDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend preview user?"
        description="This does not change a real account."
        confirmLabel="Suspend locally"
        destructive
        onConfirm={() => {
          setSuspendOpen(false);
          completePreviewAction();
        }}
      />
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
