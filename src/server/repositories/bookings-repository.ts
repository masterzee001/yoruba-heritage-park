import type { BookingRecord, CreateBookingInput } from "./repository-types";

export interface BookingsRepository {
  list(limit?: number): Promise<BookingRecord[]>;
  findById(id: string): Promise<BookingRecord | null>;
  create(input: CreateBookingInput): Promise<BookingRecord>;
}
