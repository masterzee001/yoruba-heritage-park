import { createServerFn } from "@tanstack/react-start";

import type { AdminAuditLog, AuditLogFilters, PermissionArea } from "./types";

const KNOWN_MODULES = new Set<PermissionArea>([
  "dashboard",
  "content",
  "experiences",
  "events",
  "bookings",
  "tickets",
  "payments",
  "enquiries",
  "appointments",
  "learning",
  "oriki",
  "ceremonies",
  "stay_own",
  "media",
  "sos",
  "incidents",
  "users",
  "roles",
  "settings",
  "audit_logs",
]);

export const listAdminAuditLogs = createServerFn({ method: "GET" })
  .validator((data: AuditLogFilters = {}) => data)
  .handler(async ({ data }) => {
    const { MysqlAuditLogRepository } = await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    await requireAdminServerPermission("audit.view");
    const logs = await new MysqlAuditLogRepository().listRecent(100);
    return logs.map(toAdminAuditLog).filter((log) => matchesAuditFilters(log, data));
  });

function toAdminAuditLog(log: {
  readonly id: string;
  readonly actorUserId: string | null;
  readonly actionCode: string;
  readonly moduleCode: string;
  readonly recordType: string | null;
  readonly recordId: string | null;
  readonly outcome: AdminAuditLog["outcome"];
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadataJson: unknown;
  readonly createdAt: Date;
}): AdminAuditLog {
  const module = normaliseModule(log.moduleCode);
  return {
    id: log.id,
    reference: log.id,
    occurredAt: formatAuditDate(log.createdAt),
    occurredDate: log.createdAt.toISOString().slice(0, 10),
    userPlaceholder: log.actorUserId ?? "System",
    action: formatAction(log.actionCode),
    module,
    recordReference: [log.recordType, log.recordId].filter(Boolean).join(": ") || "No record",
    outcome: log.outcome,
    ipPlaceholder: log.ipAddress ?? "Not captured",
    devicePlaceholder: summariseUserAgent(log.userAgent),
    details: summariseMetadata(log.metadataJson),
    isDemo: false,
  };
}

function matchesAuditFilters(log: AdminAuditLog, filters: AuditLogFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  const matchesSearch =
    !search ||
    [
      log.reference,
      log.action,
      log.module,
      log.recordReference,
      log.userPlaceholder,
      log.details,
      log.ipPlaceholder,
      log.devicePlaceholder,
    ].some((value) => value.toLowerCase().includes(search));
  const matchesModule =
    !filters.module || filters.module === "all" || log.module === filters.module;
  const matchesOutcome =
    !filters.outcome || filters.outcome === "all" || log.outcome === filters.outcome;
  const matchesDate = !filters.date || log.occurredDate === filters.date;
  return matchesSearch && matchesModule && matchesOutcome && matchesDate;
}

function normaliseModule(moduleCode: string): PermissionArea {
  return KNOWN_MODULES.has(moduleCode as PermissionArea)
    ? (moduleCode as PermissionArea)
    : "audit_logs";
}

function formatAction(actionCode: string): string {
  return actionCode
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, " "))
    .join(" / ");
}

function formatAuditDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function summariseUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Not captured";
  if (userAgent.length <= 90) return userAgent;
  return `${userAgent.slice(0, 87)}...`;
}

function summariseMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "No additional metadata.";
  }
  const record = metadata as Record<string, unknown>;
  const summaryKeys = [
    "reference",
    "paymentReference",
    "bookingReference",
    "providerCode",
    "previousStatus",
    "nextStatus",
    "reviewDecision",
    "message",
  ];
  const parts = summaryKeys
    .map((key) => {
      const value = record[key];
      return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? `${formatAction(key)}: ${String(value)}`
        : null;
    })
    .filter(Boolean);
  const reviewNote = typeof record.reviewNote === "string" ? record.reviewNote.trim() : "";
  if (reviewNote) parts.push(`Review note: ${reviewNote}`);
  return parts.length ? parts.join("; ") : "Metadata captured.";
}
