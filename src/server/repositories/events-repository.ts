import type { EventListFilters, EventRecord } from "./repository-types";

export interface SaveEventInput {
  readonly id?: string | null;
  readonly title: string;
  readonly slug: string;
  readonly category: string;
  readonly startsAt: string;
  readonly endsAt?: string | null;
  readonly capacity?: number | null;
  readonly status?: EventRecord["status"];
  readonly featured?: boolean;
  readonly repeating?: boolean;
  readonly notes?: string | null;
}

export interface EventsRepository {
  list(filters?: EventListFilters): Promise<EventRecord[]>;
  findById(id: string): Promise<EventRecord | null>;
  create(input: SaveEventInput): Promise<EventRecord>;
  update(input: SaveEventInput & { readonly id: string }): Promise<EventRecord | null>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
}
