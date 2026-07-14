import type { DemoRecord } from "./admin";

export type StayOwnStatus =
  | "new"
  | "contact_review"
  | "information_requested"
  | "inspection_proposed"
  | "inspection_preview"
  | "follow_up"
  | "closed"
  | "not_proceeding";

export interface AdminStayOwnEnquiry extends DemoRecord {
  id: string;
  reference: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  interest: string;
  preferredInspectionDate?: string;
  inspectionState: "not_started" | "proposed_preview" | "inspection_preview";
  buyerInterestState: "early_interest" | "information_requested" | "not_proceeding";
  followUpState: "not_started" | "pending_preview" | "completed_preview";
  assignedStaffPlaceholder: string;
  documentState: "not_available" | "pending_authorised_documents";
  status: StayOwnStatus;
  internalNotes: string;
  createdAt: string;
  timeline: Array<{ id: string; time: string; title: string; detail?: string }>;
}

export interface StayOwnFilters {
  search?: string;
  status?: StayOwnStatus | "all";
  inspectionState?: AdminStayOwnEnquiry["inspectionState"] | "all";
}
