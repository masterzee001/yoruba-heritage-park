import type { BookingRecord } from "./repository-types";

export interface BookingsRepository {
  list(limit?: number): Promise<BookingRecord[]>;
  findById(id: string): Promise<BookingRecord | null>;
}
