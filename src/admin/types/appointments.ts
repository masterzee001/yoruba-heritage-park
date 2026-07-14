import type { DemoRecord } from "./admin";
import type { EnquiryCategory } from "./enquiries";

export type AppointmentStatus =
  | "requested"
  | "scheduled"
  | "awaiting_visitor"
  | "completed"
  | "cancelled";

export interface AdminAppointment extends DemoRecord {
  id: string;
  reference: string;
  visitorName: string;
  visitorEmail: string;
  category: EnquiryCategory;
  requestedDate: string;
  scheduledFor?: string;
  status: AppointmentStatus;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
}

export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus | "all";
  category?: EnquiryCategory | "all";
}
