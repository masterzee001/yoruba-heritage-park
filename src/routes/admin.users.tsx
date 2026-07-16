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
  DetailRow,
  FilterChip,
  PermissionNotice,
  type AdminColumn,
} from "@/admin/components";
import { ADMIN_ROLE_LABELS } from "@/admin/types";
import {
  listAdminUsers,
  saveAdminUser,
  setAdminUserPassword,
  updateAdminUserStatus,
} from "@/admin/governance-functions";
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
  invited: "Invited",
  active: "Active",
  suspended: "Suspended",
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
  const [modal, setModal] = useState<"new" | "edit" | "password" | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    listAdminUsers({ data: filters })
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

  const refreshUsers = () => {
    setRows(null);
    setError(null);
    listAdminUsers({ data: filters })
      .then((list) => {
        setRows(list);
        setSelectedId((current) =>
          current && list.some((row) => row.id === current) ? current : (list[0]?.id ?? null),
        );
      })
      .catch(() => setError("User records could not be loaded."));
  };

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Admin", to: "/admin" }, { label: "Users" }]} />
      <AdminPageHeader
        eyebrow="Governance"
        title="Users"
        description="Create administrator accounts, assign roles and control account status from MySQL-backed records."
        actions={
          <PreviewButton icon={<UserPlus className="size-3.5" />} onClick={() => setModal("new")}>
            New administrator
          </PreviewButton>
        }
      />
      <PermissionNotice />

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
            caption="Administrator users"
            emptyTitle="No users"
            emptyDescription="No administrator users match the selected filters."
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
                </>
              }
            >
              <dl>
                <DetailRow label="Email">{selected.email}</DetailRow>
                <DetailRow label="Role">{ADMIN_ROLE_LABELS[selected.role]}</DetailRow>
                <DetailRow label="Invitation state">{selected.invitationState}</DetailRow>
                <DetailRow label="Last activity">
                  {selected.lastActiveAt ?? "No login recorded"}
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
                  Edit user
                </PreviewButton>
                <PreviewButton
                  icon={<KeyRound className="size-3.5" />}
                  onClick={() => setModal("password")}
                >
                  Set password
                </PreviewButton>
                <PreviewButton
                  icon={<CheckCircle2 className="size-3.5" />}
                  onClick={async () => {
                    const result = await updateAdminUserStatus({
                      data: { id: selected.id, status: "active" },
                    });
                    setNotice(result.message);
                    refreshUsers();
                  }}
                >
                  Restore active
                </PreviewButton>
                <PreviewButton
                  icon={<UserX className="size-3.5" />}
                  onClick={() => setSuspendOpen(true)}
                >
                  Suspend user
                </PreviewButton>
              </div>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No user selected">
              <p className="text-sm text-muted-foreground">Select an administrator user.</p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminModal
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
        title={
          modal === "password"
            ? "Set administrator password"
            : modal === "edit"
              ? "Edit administrator"
              : "New administrator"
        }
        description={
          modal === "password"
            ? "The password is hashed server-side. Existing sessions for this user will be revoked."
            : "New users are created without a password until credentials are issued separately."
        }
      >
        {modal === "password" ? (
          <PasswordForm
            user={selected}
            onSubmit={async (input) => {
              const result = await setAdminUserPassword({ data: input });
              setNotice(result.message);
              if (result.ok) {
                setModal(null);
                refreshUsers();
              }
            }}
          />
        ) : (
          <UserForm
            user={modal === "edit" ? selected : null}
            onSubmit={async (input) => {
              const result = await saveAdminUser({ data: input });
              setNotice(result.message);
              if (result.ok) {
                setModal(null);
                refreshUsers();
              }
            }}
          />
        )}
      </AdminModal>
      <AdminConfirmationDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend administrator?"
        description="The account will remain in the database but will no longer be an active administrator."
        confirmLabel="Suspend user"
        destructive
        onConfirm={async () => {
          if (!selected) return;
          const result = await updateAdminUserStatus({
            data: { id: selected.id, status: "suspended" },
          });
          setSuspendOpen(false);
          setNotice(result.message);
          refreshUsers();
        }}
      />
    </>
  );
}

function UserForm({
  user,
  onSubmit,
}: {
  user: AdminUser | null;
  onSubmit: (input: {
    id?: string;
    name: string;
    email: string;
    role: AdminRole;
    status: AdminUserStatus;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<AdminRole>(user?.role ?? "viewer");
  const [status, setStatus] = useState<AdminUserStatus>(user?.status ?? "invited");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
          await onSubmit({ id: user?.id, name, email, role, status });
        } finally {
          setSaving(false);
        }
      }}
    >
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        placeholder="Display name"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        placeholder="email@example.com"
        value={email}
        disabled={Boolean(user)}
        onChange={(event) => setEmail(event.currentTarget.value)}
      />
      <select
        className="rounded-sm border border-border px-3 py-2 text-sm"
        value={role}
        onChange={(event) => setRole(event.currentTarget.value as AdminRole)}
      >
        {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        className="rounded-sm border border-border px-3 py-2 text-sm"
        value={status}
        onChange={(event) => setStatus(event.currentTarget.value as AdminUserStatus)}
      >
        <option value="invited">Invited</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-forest-deep px-4 py-2 text-sm text-ivory disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save user"}
      </button>
    </form>
  );
}

function PasswordForm({
  user,
  onSubmit,
}: {
  user: AdminUser | null;
  onSubmit: (input: { id?: string; password: string; confirmPassword: string }) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
          await onSubmit({ id: user.id, password, confirmPassword });
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="rounded-sm border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {user ? `${user.name} (${user.email})` : "No administrator selected."}
      </div>
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        type="password"
        autoComplete="new-password"
        placeholder="New password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
      />
      <input
        className="rounded-sm border border-border px-3 py-2 text-sm"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.currentTarget.value)}
      />
      <button
        type="submit"
        disabled={saving || !user}
        className="rounded-sm bg-forest-deep px-4 py-2 text-sm text-ivory disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save password"}
      </button>
    </form>
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
