import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardList,
  FileText,
  Flame,
  Home,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  ShieldAlert,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { to: "/admin/bookings", label: "Bookings", icon: Ticket },
      { to: "/admin/tickets", label: "Tickets & check-in", icon: Ticket },
      { to: "/admin/enquiries", label: "Enquiries", icon: ClipboardList },
      { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
      { to: "/admin/payments", label: "Payments", icon: Wallet, disabled: true, badge: "Phase 3" },
    ],
  },
  {
    id: "programme",
    label: "Programme",
    items: [
      { to: "/admin/experiences", label: "Experiences", icon: BookOpen },
      { to: "/admin/events", label: "Events", icon: Calendar },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      {
        to: "/admin/learning",
        label: "Learning hub",
        icon: BookOpen,
        disabled: true,
        badge: "Phase 3",
      },
      {
        to: "/admin/oriki",
        label: "Oríkì services",
        icon: ScrollText,
        disabled: true,
        badge: "Phase 3",
      },
      {
        to: "/admin/ceremonies",
        label: "Ceremonies",
        icon: Flame,
        disabled: true,
        badge: "Phase 3",
      },
      { to: "/admin/stay-own", label: "Stay & Own", icon: Home, disabled: true, badge: "Phase 4" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { to: "/admin/content", label: "Pages & content", icon: FileText },
      {
        to: "/admin/media",
        label: "Media library",
        icon: ImageIcon,
        disabled: true,
        badge: "Phase 3",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety",
    items: [
      { to: "/admin/sos", label: "SOS console", icon: ShieldAlert, danger: true },
      {
        to: "/admin/incidents",
        label: "Incidents",
        icon: LifeBuoy,
        disabled: true,
        badge: "Phase 3",
      },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { to: "/admin/users", label: "Users", icon: Users, disabled: true, badge: "Phase 3" },
      { to: "/admin/roles", label: "Roles", icon: KeyRound, disabled: true, badge: "Phase 3" },
      {
        to: "/admin/settings",
        label: "Settings",
        icon: Settings,
        disabled: true,
        badge: "Phase 3",
      },
      {
        to: "/admin/audit-logs",
        label: "Audit logs",
        icon: ScrollText,
        disabled: true,
        badge: "Phase 3",
      },
    ],
  },
];

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items);
