import type { DemoRecord } from "./admin";

export type LearningResourceType =
  | "article"
  | "pdf_resource"
  | "audio_guide"
  | "teacher_resource"
  | "school_group_guide"
  | "research_note";

export type LearningAudience = "general" | "teachers" | "students" | "researchers" | "families";
export type LearningStatus = "draft" | "in_review" | "approved" | "published_preview" | "archived";

export interface AdminLearningResource extends DemoRecord {
  id: string;
  title: string;
  type: LearningResourceType;
  audience: LearningAudience;
  category: string;
  description: string;
  status: LearningStatus;
  featured: boolean;
  accessLevel: "public_preview" | "staff_preview" | "restricted_preview";
  filePlaceholder?: string;
  audioPlaceholder?: string;
  updatedAt: string;
  reviewState: "awaiting_authorised_content" | "pending_review" | "approved_preview";
}

export interface LearningFilters {
  search?: string;
  type?: LearningResourceType | "all";
  audience?: LearningAudience | "all";
  status?: LearningStatus | "all";
}
