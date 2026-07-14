import type { DemoRecord } from "./admin";

export type CeremonyType =
  | "naming_ceremony"
  | "wedding"
  | "private_ceremony"
  | "cultural_celebration"
  | "prayer_gathering"
  | "other_approved";

export type CeremonyStatus =
  | "new"
  | "in_review"
  | "awaiting_information"
  | "date_proposed"
  | "proposal_preview"
  | "scheduled_preview"
  | "completed_preview"
  | "cancelled"
  | "closed";

export interface AdminCeremonyEnquiry extends DemoRecord {
  id: string;
  reference: string;
  ceremonyType: CeremonyType;
  contactName: string;
  contactEmail: string;
  preferredDate?: string;
  guestEstimate?: string;
  venuePreference: string;
  requirements: string;
  proposalState: "not_started" | "draft_preview" | "proposal_preview";
  assignedCoordinatorPlaceholder: string;
  status: CeremonyStatus;
  internalNotes: string;
  createdAt: string;
  timeline: Array<{ id: string; time: string; title: string; detail?: string }>;
}

export interface CeremonyFilters {
  search?: string;
  ceremonyType?: CeremonyType | "all";
  status?: CeremonyStatus | "all";
  preferredDate?: string;
}
