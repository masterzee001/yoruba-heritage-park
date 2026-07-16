import type { DemoRecord } from "./admin";

export type EventStatus = "draft" | "published" | "cancelled" | "appointment_only";

export interface AdminEvent extends DemoRecord {
  id: string;
  title: string;
  slug: string;
  category: string;
  startsAt: string;
  startsAtInput: string;
  endsAt?: string;
  endsAtInput?: string;
  capacity: number | null;
  booked: number;
  status: EventStatus;
  featured: boolean;
  repeating: boolean;
  notes?: string;
  deletedAt?: string;
}

export interface EventFilters {
  search?: string;
  status?: EventStatus | "all";
  category?: string;
  includeDeleted?: boolean;
}

export interface AdminExperience extends DemoRecord {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  duration: string;
  availability: string;
  bookingType: "scheduled" | "appointment" | "self_guided";
  featured: boolean;
  displayOrder: number;
  status: "draft" | "published" | "archived";
  accessibility?: string;
}

export interface ExperienceFilters {
  search?: string;
  status?: AdminExperience["status"] | "all";
  bookingType?: AdminExperience["bookingType"] | "all";
}

export interface CalendarFilters {
  search?: string;
  status?: EventStatus | "all";
}
