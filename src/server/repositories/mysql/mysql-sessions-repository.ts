import type { RowDataPacket } from "mysql2";
import type { Pool, ResultSetHeader } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type {
  CreateSessionInput,
  SessionAuthenticationRecord,
  SessionRecord,
  SessionsRepository,
} from "../sessions-repository";
import { createRepositoryId, requireId } from "./mysql-helpers";

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  token_hash: string;
  csrf_token_hash: string;
  created_at: Date;
  last_seen_at: Date;
  idle_expires_at: Date;
  absolute_expires_at: Date;
  revoked_at: Date | null;
  revoked_reason: string | null;
}

interface SessionAuthRow extends SessionRow {
  email: string;
  display_name: string;
  account_status: SessionAuthenticationRecord["principal"]["accountStatus"];
}

export class MysqlSessionsRepository implements SessionsRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async create(input: CreateSessionInput): Promise<SessionRecord> {
    try {
      const id = createRepositoryId("sess");
      await this.pool.query(
        `INSERT INTO auth_sessions (
          id, user_id, token_hash, csrf_token_hash, created_at, last_seen_at,
          idle_expires_at, absolute_expires_at, ip_hash, user_agent_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          requireId(input.userId),
          input.tokenHash,
          input.csrfTokenHash,
          input.createdAt,
          input.lastSeenAt,
          input.idleExpiresAt,
          input.absoluteExpiresAt,
          input.ipHash ?? null,
          input.userAgentHash ?? null,
        ],
      );
      const created = await this.findById(id);
      if (!created) throw new Error("Session insert did not return a row.");
      return created;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async findActiveByTokenHash(
    tokenHash: string,
    now = new Date(),
  ): Promise<SessionAuthenticationRecord | null> {
    try {
      const [rows] = await this.pool.query<SessionAuthRow[]>(
        `SELECT s.id, s.user_id, s.token_hash, s.csrf_token_hash, s.created_at, s.last_seen_at,
          s.idle_expires_at, s.absolute_expires_at, s.revoked_at, s.revoked_reason,
          u.email, u.display_name, u.account_status
         FROM auth_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?
           AND s.revoked_at IS NULL
           AND s.idle_expires_at > ?
           AND s.absolute_expires_at > ?
           AND u.account_status = 'active'
           AND u.archived_at IS NULL
         LIMIT 1`,
        [tokenHash, now, now],
      );
      return rows[0] ? mapSessionAuth(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async updateLastSeen(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void> {
    try {
      await this.pool.query(
        "UPDATE auth_sessions SET last_seen_at = ?, idle_expires_at = ? WHERE id = ? AND revoked_at IS NULL",
        [lastSeenAt, idleExpiresAt, requireId(sessionId)],
      );
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async revokeByTokenHash(tokenHash: string, reason: string): Promise<boolean> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        "UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ? WHERE token_hash = ? AND revoked_at IS NULL",
        [reason, tokenHash],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async revokeBySessionId(sessionId: string, reason: string): Promise<boolean> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        "UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ? WHERE id = ? AND revoked_at IS NULL",
        [reason, requireId(sessionId)],
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async revokeAllForUser(userId: string, reason: string): Promise<number> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        "UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ? WHERE user_id = ? AND revoked_at IS NULL",
        [reason, requireId(userId)],
      );
      return result.affectedRows;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  private async findById(id: string): Promise<SessionRecord | null> {
    const [rows] = await this.pool.query<SessionRow[]>(
      `SELECT id, user_id, token_hash, csrf_token_hash, created_at, last_seen_at,
        idle_expires_at, absolute_expires_at, revoked_at, revoked_reason
       FROM auth_sessions WHERE id = ? LIMIT 1`,
      [requireId(id)],
    );
    return rows[0] ? mapSession(rows[0]) : null;
  }
}

function mapSessionAuth(row: SessionAuthRow): SessionAuthenticationRecord {
  return {
    ...mapSession(row),
    principal: {
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      accountStatus: row.account_status,
      roleCodes: [],
      roleLabels: [],
      permissionCodes: [],
    },
  };
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    csrfTokenHash: row.csrf_token_hash,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    idleExpiresAt: row.idle_expires_at,
    absoluteExpiresAt: row.absolute_expires_at,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
  };
}
