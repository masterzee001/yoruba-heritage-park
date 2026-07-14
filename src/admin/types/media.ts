import type { DemoRecord } from "./admin";

export type MediaType = "image" | "document" | "audio" | "video_placeholder";
export type MediaUsage = "homepage" | "experience" | "learning" | "admin" | "unused";
export type MediaReviewState = "pending_review" | "approved_preview" | "not_yet_published";

export interface AdminMediaAsset extends DemoRecord {
  id: string;
  fileNamePlaceholder: string;
  mediaType: MediaType;
  dimensions?: string;
  fileSize: string;
  altText: string;
  caption: string;
  usage: MediaUsage[];
  createdAt: string;
  reviewState: MediaReviewState;
}

export interface MediaFilters {
  search?: string;
  mediaType?: MediaType | "all";
  usage?: MediaUsage | "all";
}
