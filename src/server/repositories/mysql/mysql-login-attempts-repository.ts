import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type {
  CreateLoginAttemptInput,
  LoginAttemptsRepository,
} from "../login-attempts-repository";
import { createRepositoryId } from "./mysql-helpers";

interface CountRow extends RowDataPacket {
  email_failures: number | null;
  ip_failures: number | null;
}

export class MysqlLoginAttemptsRepository implements LoginAttemptsRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async record(input: CreateLoginAttemptInput): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO auth_login_attempts (
          id, email_hash, ip_hash, outcome, attempted_at, user_id, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          createRepositoryId("login"),
          input.emailHash,
          input.ipHash,
          input.outcome,
          input.attemptedAt,
          input.userId ?? null,
          JSON.stringify(input.metadataJson ?? {}),
        ],
      );
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async countRecentFailures(input: {
    readonly emailHash: string;
    readonly ipHash: string;
    readonly since: Date;
  }): Promise<{ emailFailures: number; ipFailures: number }> {
    try {
      const [rows] = await this.pool.query<CountRow[]>(
        `SELECT
          SUM(CASE WHEN email_hash = ? THEN 1 ELSE 0 END) AS email_failures,
          SUM(CASE WHEN ip_hash = ? THEN 1 ELSE 0 END) AS ip_failures
         FROM auth_login_attempts
         WHERE attempted_at >= ?
           AND outcome IN ('invalid_credentials', 'account_locked', 'account_disabled', 'rate_limited')
           AND (email_hash = ? OR ip_hash = ?)`,
        [input.emailHash, input.ipHash, input.since, input.emailHash, input.ipHash],
      );
      return {
        emailFailures: Number(rows[0]?.email_failures ?? 0),
        ipFailures: Number(rows[0]?.ip_failures ?? 0),
      };
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}
