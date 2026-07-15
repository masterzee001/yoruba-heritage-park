import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { UserRecord } from "../repository-types";
import type { UsersRepository } from "../users-repository";
import { normaliseEmail, requireId } from "./mysql-helpers";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  display_name: string;
  account_status: UserRecord["accountStatus"];
  email_verified_at: Date | null;
  last_login_at: Date | null;
  failed_login_count: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export class MysqlUsersRepository implements UsersRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async findById(id: string): Promise<UserRecord | null> {
    try {
      const [rows] = await this.pool.query<UserRow[]>(
        `SELECT id, email, display_name, account_status, email_verified_at, last_login_at,
          failed_login_count, locked_until, created_at, updated_at, archived_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [requireId(id)],
      );
      return rows[0] ? mapUser(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    try {
      const [rows] = await this.pool.query<UserRow[]>(
        `SELECT id, email, display_name, account_status, email_verified_at, last_login_at,
          failed_login_count, locked_until, created_at, updated_at, archived_at
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [normaliseEmail(email)],
      );
      return rows[0] ? mapUser(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at,
    lastLoginAt: row.last_login_at,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}
