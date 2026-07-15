import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

import { getDatabasePool, toDatabaseError } from "../../db";
import type { AuditLogRepository } from "../audit-log-repository";
import type { AuditLogRecord, CreateAuditLogInput } from "../repository-types";
import {
  createRepositoryId,
  parseJsonValue,
  requireCode,
  requireId,
  requireLimit,
} from "./mysql-helpers";

interface AuditLogRow extends RowDataPacket {
  id: string;
  actor_user_id: string | null;
  action_code: string;
  module_code: string;
  record_type: string | null;
  record_id: string | null;
  outcome: AuditLogRecord["outcome"];
  ip_address: string | null;
  user_agent: string | null;
  metadata_json: string;
  created_at: Date;
}

export class MysqlAuditLogRepository implements AuditLogRepository {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async findById(id: string): Promise<AuditLogRecord | null> {
    try {
      const [rows] = await this.pool.query<AuditLogRow[]>(
        `SELECT id, actor_user_id, action_code, module_code, record_type, record_id, outcome,
          ip_address, user_agent, metadata_json, created_at
         FROM audit_logs
         WHERE id = ?
         LIMIT 1`,
        [requireId(id)],
      );
      return rows[0] ? mapAuditLog(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async listRecent(limit = 25): Promise<AuditLogRecord[]> {
    try {
      const [rows] = await this.pool.query<AuditLogRow[]>(
        `SELECT id, actor_user_id, action_code, module_code, record_type, record_id, outcome,
          ip_address, user_agent, metadata_json, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT ?`,
        [requireLimit(limit)],
      );
      return rows.map(mapAuditLog);
    } catch (error) {
      throw toDatabaseError(error);
    }
  }

  async record(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    try {
      const id = createRepositoryId("aud");
      const metadata = JSON.stringify(input.metadataJson ?? {});
      await this.pool.query(
        `INSERT INTO audit_logs (
          id, actor_user_id, action_code, module_code, record_type, record_id, outcome,
          ip_address, user_agent, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.actorUserId ?? null,
          requireCode(input.actionCode),
          requireCode(input.moduleCode),
          input.recordType ?? null,
          input.recordId ?? null,
          input.outcome,
          input.ipAddress ?? null,
          input.userAgent ?? null,
          metadata,
        ],
      );
      const created = await this.findById(id);
      if (!created) throw new Error("Audit log insert did not return a row.");
      return created;
    } catch (error) {
      throw toDatabaseError(error);
    }
  }
}

function mapAuditLog(row: AuditLogRow): AuditLogRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actionCode: row.action_code,
    moduleCode: row.module_code,
    recordType: row.record_type,
    recordId: row.record_id,
    outcome: row.outcome,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadataJson: parseJsonValue(row.metadata_json),
    createdAt: row.created_at,
  };
}
