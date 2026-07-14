import type { DemoRecord } from "./admin";

export type OrikiRequestStatus =
  | "new"
  | "under_review"
  | "awaiting_information"
  | "consultation_proposed"
  | "scheduled_preview"
  | "cultural_review"
  | "completed_preview"
  | "closed";

export interface AdminOrikiRequest extends DemoRecord {
  id: string;
  reference: string;
  requestType: "personal" | "family";
  visitorName: string;
  visitorEmail: string;
  preferredFormat: "consultation" | "written_summary" | "audio_preview" | "not_selected";
  status: OrikiRequestStatus;
  culturalReviewStatus: "not_started" | "pending_authorised_review" | "review_preview";
  appointmentState: "not_scheduled" | "proposed_preview" | "scheduled_preview";
  assignedPractitionerPlaceholder: string;
  internalNotes: string;
  deliveryStatePlaceholder: string;
  createdAt: string;
  timeline: Array<{ id: string; time: string; title: string; detail?: string }>;
}

export interface OrikiFilters {
  search?: string;
  status?: OrikiRequestStatus | "all";
  requestType?: AdminOrikiRequest["requestType"] | "all";
}
