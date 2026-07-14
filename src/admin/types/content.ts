import type { DemoRecord } from "./admin";

export type ContentStatus = "draft" | "in_review" | "approved" | "published" | "archived";

export interface ContentPage extends DemoRecord {
  id: string;
  title: string;
  slug: string;
  section: "public" | "learn" | "visit" | "system";
  status: ContentStatus;
  updatedAt: string;
  updatedBy: string;
  summary: string;
  owner?: string;
  reviewNote?: string;
}

export interface ContentFilters {
  search?: string;
  status?: ContentStatus | "all";
  section?: ContentPage["section"] | "all";
}
