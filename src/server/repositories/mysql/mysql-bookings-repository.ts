import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { BookingsRepository } from "../bookings-repository";
import type { BookingRecord, CreateBookingInput } from "../repository-types";
import { createRepositoryId, normaliseEmail, requireId, requireLimit } from "./mysql-helpers";

interface BookingRow extends RowDataPacket {
  id: string;
  reference: string;
  visitor_name: string;
  visitor_email: string;
  country_of_origin: string | null;
  booking_type: string;
  visit_date: Date;
  duration_of_stay_days: number | null;
  guests: number;
  amount_minor: number;
  currency: string;
  payment_state: BookingRecord["paymentState"];
  status: BookingRecord["status"];
  checked_in_at: Date | null;
  source: BookingRecord["source"];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class MysqlBookingsRepository implements BookingsRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async list(limit = 50): Promise<BookingRecord[]> {
    try {
      const [rows] = await this.pool.query<BookingRow[]>(
        `SELECT id, reference, visitor_name, visitor_email, country_of_origin, booking_type,
          visit_date, duration_of_stay_days, guests, amount_minor, currency, payment_state,
          status, checked_in_at, source, notes, created_at, updated_at, deleted_at
         FROM bookings
         WHERE deleted_at IS NULL
         ORDER BY visit_date DESC, created_at DESC
         LIMIT ?`,
        [requireLimit(limit)],
      );
      return rows.map(mapBooking);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async findById(id: string): Promise<BookingRecord | null> {
    try {
      const [rows] = await this.pool.query<BookingRow[]>(
        `SELECT id, reference, visitor_name, visitor_email, country_of_origin, booking_type,
          visit_date, duration_of_stay_days, guests, amount_minor, currency, payment_state,
          status, checked_in_at, source, notes, created_at, updated_at, deleted_at
         FROM bookings
         WHERE id = ?
         LIMIT 1`,
        [requireId(id)],
      );
      return rows[0] ? mapBooking(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async create(input: CreateBookingInput): Promise<BookingRecord> {
    const id = createRepositoryId("booking");
    const reference = createBookingReference();
    const visitorName = input.visitorName.trim();
    const visitorEmail = normaliseEmail(input.visitorEmail);
    const bookingType = input.bookingType.trim();
    const countryOfOrigin = input.countryOfOrigin?.trim() || null;
    const durationOfStayDays = input.durationOfStayDays ?? null;
    const guests = Math.max(1, Math.trunc(input.guests));
    const amountMinor = Math.max(0, Math.trunc(input.amountMinor ?? 0));
    const currency = (input.currency ?? "NGN").trim().toUpperCase();
    const paymentState = input.paymentState ?? "not_applicable";
    const status = input.status ?? "pending";
    const source = input.source ?? "website";
    const notes = input.notes?.trim() || null;

    try {
      await this.pool.execute(
        `INSERT INTO bookings (
          id, reference, visitor_name, visitor_email, country_of_origin, booking_type,
          visit_date, duration_of_stay_days, guests, amount_minor, currency, payment_state,
          status, source, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          reference,
          visitorName,
          visitorEmail,
          countryOfOrigin,
          bookingType,
          input.visitDate,
          durationOfStayDays,
          guests,
          amountMinor,
          currency,
          paymentState,
          status,
          source,
          notes,
        ],
      );
      const booking = await this.findById(id);
      if (!booking) throw new Error("Created booking could not be read.");
      return booking;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function createBookingReference(): string {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `YHP-B-${stamp}-${suffix}`;
}

function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    reference: row.reference,
    visitorName: row.visitor_name,
    visitorEmail: row.visitor_email,
    countryOfOrigin: row.country_of_origin,
    bookingType: row.booking_type,
    visitDate: row.visit_date,
    durationOfStayDays: row.duration_of_stay_days,
    guests: row.guests,
    amountMinor: row.amount_minor,
    currency: row.currency,
    paymentState: row.payment_state,
    status: row.status,
    checkedInAt: row.checked_in_at,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
