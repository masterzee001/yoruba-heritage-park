import type { AuditLogRecord, CreateAuditLogInput } from "./repository-types";

export interface AuditLogRepository {
  findById(id: string): Promise<AuditLogRecord | null>;
  listRecent(limit?: number): Promise<AuditLogRecord[]>;
  record(input: CreateAuditLogInput): Promise<AuditLogRecord>;
}
