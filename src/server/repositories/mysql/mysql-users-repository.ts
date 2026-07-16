import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { AuthenticationRecord } from "../../auth/auth-types";
import type { UserRecord } from "../repository-types";
import type {
  CreateUserInput,
  FailedLoginStateInput,
  UpdateUserInput,
  UsersRepository,
} from "../users-repository";
import { createRepositoryId, normaliseEmail, requireId, requireLimit } from "./mysql-helpers";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
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

  async list(limit = 100): Promise<UserRecord[]> {
    try {
      const [rows] = await this.pool.query<UserRow[]>(
        `SELECT id, email, display_name, account_status, email_verified_at, last_login_at,
          failed_login_count, locked_until, created_at, updated_at, archived_at
         FROM users
         WHERE archived_at IS NULL
         ORDER BY created_at DESC
         LIMIT ?`,
        [requireLimit(limit)],
      );
      return rows.map(mapUser);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

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

  async findSafeUserById(id: string): Promise<UserRecord | null> {
    return this.findById(id);
  }

  async findAuthenticationRecordByEmail(email: string): Promise<AuthenticationRecord | null> {
    try {
      const [rows] = await this.pool.query<UserRow[]>(
        `SELECT id, email, display_name, password_hash, account_status, email_verified_at,
          last_login_at, failed_login_count, locked_until, created_at, updated_at, archived_at
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [normaliseEmail(email)],
      );
      return rows[0] ? mapAuthenticationRecord(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async updateFailedLoginState(input: FailedLoginStateInput): Promise<void> {
    try {
      await this.pool.query(
        "UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?",
        [input.failedLoginCount, input.lockedUntil ?? null, requireId(input.userId)],
      );
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const id = createRepositoryId("user");
    try {
      await this.pool.query(
        `INSERT INTO users (id, email, display_name, account_status)
         VALUES (?, ?, ?, ?)`,
        [
          id,
          normaliseEmail(input.email),
          requireDisplayName(input.displayName),
          input.accountStatus ?? "invited",
        ],
      );
      const created = await this.findById(id);
      if (!created) throw new Error("User was not created.");
      return created;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async update(input: UpdateUserInput): Promise<UserRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (input.displayName !== undefined) {
      updates.push("display_name = ?");
      values.push(requireDisplayName(input.displayName));
    }
    if (input.accountStatus !== undefined) {
      updates.push("account_status = ?");
      values.push(input.accountStatus);
    }
    if (!updates.length) return this.findById(input.userId);

    try {
      values.push(requireId(input.userId));
      await this.pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
      return this.findById(input.userId);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async updateLastLogin(userId: string, lastLoginAt: Date): Promise<void> {
    try {
      await this.pool.query(
        "UPDATE users SET last_login_at = ?, failed_login_count = 0, locked_until = NULL WHERE id = ?",
        [lastLoginAt, requireId(userId)],
      );
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    try {
      await this.pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        requireId(userId),
      ]);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function requireDisplayName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 191) throw new Error("Display name is required.");
  return trimmed;
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

function mapAuthenticationRecord(row: UserRow): AuthenticationRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    accountStatus: row.account_status,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until,
    archivedAt: row.archived_at,
  };
}
