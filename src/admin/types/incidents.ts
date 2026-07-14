import type { DemoRecord } from "./admin";

export type IncidentSource =
  | "test_sos_alert"
  | "visitor_safety_report"
  | "medical_report"
  | "lost_visitor_report"
  | "fire_report"
  | "injury_report"
  | "animal_report"
  | "facility_report"
  | "staff_report";

export type IncidentCategory =
  | "medical"
  | "lost_or_separated"
  | "fire"
  | "injury"
  | "animal"
  | "facility"
  | "security"
  | "other";

export type IncidentSeverity = "low" | "moderate" | "high" | "critical_preview";
export type IncidentStatus =
  | "test"
  | "reported"
  | "under_review"
  | "acknowledged_preview"
  | "responding_preview"
  | "resolved_preview"
  | "false_alarm"
  | "closed";

export interface AdminIncident extends DemoRecord {
  id: string;
  reference: string;
  source: IncidentSource;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  visitorOrTicketPlaceholder: string;
  locationDescriptionPlaceholder: string;
  gpsPlaceholder: string;
  reportedAt: string;
  assignedOfficerPlaceholder: string;
  acknowledgedAt?: string;
  responseNotes: string;
  resolutionNotes: string;
  closedAt?: string;
  relatedSosReference?: string;
  evidencePlaceholder: string;
  timeline: Array<{ id: string; time: string; title: string; detail?: string }>;
}

export interface IncidentFilters {
  search?: string;
  category?: IncidentCategory | "all";
  severity?: IncidentSeverity | "all";
  status?: IncidentStatus | "all";
  date?: string;
}
