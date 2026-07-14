import type { DemoRecord } from "./admin";

export type SosStatus =
  | "test"
  | "new"
  | "acknowledged"
  | "responding"
  | "resolved"
  | "false_alarm"
  | "closed";

export type SosCategory =
  | "security"
  | "medical"
  | "lost"
  | "fire"
  | "accident"
  | "animal"
  | "other";

export interface AdminSosAlert extends DemoRecord {
  id: string;
  reference: string;
  category: SosCategory;
  visitorName?: string;
  ticketReference?: string;
  latitudePlaceholder: string;
  longitudePlaceholder: string;
  accuracyPlaceholder: string;
  receivedAt: string;
  acknowledgedAt?: string;
  closedAt?: string;
  status: SosStatus;
  assignedResponder?: string;
  responseNotes?: string;
  locationLabel: string;
}
