import { Check } from "lucide-react";
import type { PermissionAction, PermissionArea } from "../types";

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  publish: "Publish",
  archive: "Archive",
  export_preview: "Export",
  assign: "Assign",
  acknowledge: "Acknowledge",
  resolve: "Resolve",
  manage_users: "Manage Users",
  manage_settings: "Manage Settings",
  view_audit_logs: "View Audit Logs",
};

const AREA_LABELS: Record<PermissionArea, string> = {
  dashboard: "Dashboard",
  content: "Content",
  experiences: "Experiences",
  events: "Events",
  bookings: "Bookings",
  tickets: "Tickets",
  payments: "Payments",
  enquiries: "Enquiries",
  appointments: "Appointments",
  learning: "Learning",
  oriki: "Oríkì",
  ceremonies: "Ceremonies",
  stay_own: "Stay & Own",
  media: "Media",
  sos: "SOS",
  incidents: "Incidents",
  users: "Users",
  roles: "Roles",
  settings: "Settings",
  audit_logs: "Audit Logs",
};

interface Props {
  permissions: Partial<Record<PermissionArea, PermissionAction[]>>;
}

export function AdminPermissionMatrix({ permissions }: Props) {
  const rows = Object.entries(permissions) as Array<[PermissionArea, PermissionAction[]]>;

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No permissions assigned yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-border">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="bg-cream/50 uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Area</th>
            <th className="px-3 py-2 font-medium">Assigned permissions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([area, actions]) => (
            <tr key={area} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-forest-deep">{AREA_LABELS[area]}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1.5">
                  {actions.map((action) => (
                    <span
                      key={`${area}-${action}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5"
                    >
                      <Check className="size-3 text-forest" aria-hidden />
                      {ACTION_LABELS[action]}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
