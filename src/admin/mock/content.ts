import type { ContentPage } from "../types";

export const mockContentPages: ContentPage[] = [
  {
    isDemo: true,
    id: "c-001",
    title: "Home",
    slug: "/",
    section: "public",
    status: "published",
    updatedAt: "2026-07-01T10:00:00Z",
    updatedBy: "Sample Operator",
    summary: "Public homepage — approved copy.",
  },
  {
    isDemo: true,
    id: "c-002",
    title: "About",
    slug: "/about",
    section: "public",
    status: "in_review",
    updatedAt: "2026-07-04T10:00:00Z",
    updatedBy: "Sample Operator",
    summary: "Pending operational confirmation of cultural narrative.",
  },
  {
    isDemo: true,
    id: "c-003",
    title: "Plan Your Visit",
    slug: "/plan",
    section: "visit",
    status: "draft",
    updatedAt: "2026-07-08T10:00:00Z",
    updatedBy: "Sample Operator",
    summary: "Awaiting authorised opening-hours and admission details.",
  },
];
