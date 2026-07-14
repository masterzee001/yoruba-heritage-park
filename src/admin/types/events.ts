import type { DemoRecord } from "./admin";

export type EventStatus = "draft" | "published" | "cancelled" | "appointment_only";

export interface AdminEvent extends DemoRecord {
  id: string;
  title: string;
  slug: string;
  category: string;
  startsAt: string;
  endsAt?: string;
  capacity: number | null;
  booked: number;
  status: EventStatus;
  featured: boolean;
  repeating: boolean;
  notes?: string;
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
