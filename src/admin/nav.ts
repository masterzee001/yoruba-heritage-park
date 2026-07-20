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
  ScrollText,
  Settings,
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
      { to: "/admin/payments", label: "Payments", icon: Wallet },
    ],
  },
  {
    id: "programme",
    label: "Programme",
    items: [
      { to: "/admin/experiences", label: "Experiences", icon: BookOpen },
      { to: "/admin/events", label: "Events", icon: Calendar },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/admin/learning", label: "Learning hub", icon: BookOpen },
      { to: "/admin/oriki", label: "Oríkì services", icon: ScrollText },
      { to: "/admin/ceremonies", label: "Ceremonies", icon: Flame },
      { to: "/admin/stay-own", label: "Stay & Own", icon: Home },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { to: "/admin/content", label: "Pages & content", icon: FileText },
      { to: "/admin/media", label: "Media library", icon: ImageIcon },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/roles", label: "Roles", icon: KeyRound },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
    ],
  },
];

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((group) => group.items);
