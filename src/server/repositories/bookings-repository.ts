import type {
  BookingRecord,
  CreateBookingInput,
  UpdateBookingWorkflowInput,
} from "./repository-types";

export interface BookingsRepository {
  list(limit?: number): Promise<BookingRecord[]>;
  findById(id: string): Promise<BookingRecord | null>;
  findByReference(reference: string): Promise<BookingRecord | null>;
  create(input: CreateBookingInput): Promise<BookingRecord>;
  updateWorkflow(id: string, input: UpdateBookingWorkflowInput): Promise<BookingRecord | null>;
}
