import type { EventListFilters, EventRecord } from "./repository-types";

export interface EventsRepository {
  list(filters?: EventListFilters): Promise<EventRecord[]>;
  findById(id: string): Promise<EventRecord | null>;
  softDelete(id: string): Promise<boolean>;
}
