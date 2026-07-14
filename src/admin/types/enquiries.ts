import type { DemoRecord } from "./admin";

export type EnquiryCategory =
  | "general"
  | "oriki"
  | "naming_ceremony"
  | "wedding"
  | "private_ceremony"
  | "school_visit"
  | "group_visit"
  | "prayer"
  | "purification"
  | "stay_and_own"
  | "media_research"
  | "transport";

export type EnquiryStatus =
  | "new"
  | "assigned"
  | "in_review"
  | "awaiting_visitor"
  | "scheduled"
  | "resolved"
  | "closed"
  | "spam";

export interface AdminEnquiry extends DemoRecord {
  id: string;
  reference: string;
  category: EnquiryCategory;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
  priority: "low" | "normal" | "high";
  status: EnquiryStatus;
  assignedTo?: string;
  createdAt: string;
  proposedDate?: string;
}

export interface EnquiryFilters {
  search?: string;
  status?: EnquiryStatus | "all";
  category?: EnquiryCategory | "all";
}
