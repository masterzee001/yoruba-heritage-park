import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { EventsRepository } from "../events-repository";
import type { EventListFilters, EventRecord } from "../repository-types";
import { requireId, requireLimit } from "./mysql-helpers";

interface EventRow extends RowDataPacket {
  id: string;
  title: string;
  slug: string;
  category: string;
  starts_at: Date;
  ends_at: Date | null;
  capacity: number | null;
  booked_count: number;
  status: EventRecord["status"];
  featured: 0 | 1;
  repeating: 0 | 1;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class MysqlEventsRepository implements EventsRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async list(filters: EventListFilters = {}): Promise<EventRecord[]> {
    try {
      const where: string[] = [];
      const values: Array<string | number> = [];

      if (!filters.includeDeleted) where.push("deleted_at IS NULL");
      if (filters.status && filters.status !== "all") {
        where.push("status = ?");
        values.push(filters.status);
      }
      if (filters.category) {
        where.push("category = ?");
        values.push(filters.category);
      }
      if (filters.search?.trim()) {
        const search = `%${filters.search.trim()}%`;
        where.push("(title LIKE ? OR slug LIKE ? OR category LIKE ? OR notes LIKE ?)");
        values.push(search, search, search, search);
      }

      const [rows] = await this.pool.query<EventRow[]>(
        `SELECT id, title, slug, category, starts_at, ends_at, capacity, booked_count, status,
          featured, repeating, notes, created_at, updated_at, deleted_at
         FROM events
         ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
         ORDER BY starts_at DESC
         LIMIT ?`,
        [...values, requireLimit(filters.limit ?? 50)],
      );
      return rows.map(mapEvent);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async findById(id: string): Promise<EventRecord | null> {
    try {
      const [rows] = await this.pool.query<EventRow[]>(
        `SELECT id, title, slug, category, starts_at, ends_at, capacity, booked_count, status,
          featured, repeating, notes, created_at, updated_at, deleted_at
         FROM events
         WHERE id = ?
         LIMIT 1`,
        [requireId(id)],
      );
      return rows[0] ? mapEvent(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        "UPDATE events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        [requireId(id)],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    bookedCount: row.booked_count,
    status: row.status,
    featured: row.featured === 1,
    repeating: row.repeating === 1,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
