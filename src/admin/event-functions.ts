import { createServerFn } from "@tanstack/react-start";

import type { AdminEvent, EventFilters } from "./types";

interface EventListInput {
  readonly search?: string;
  readonly status?: AdminEvent["status"] | "all";
  readonly category?: string;
  readonly includeDeleted?: boolean;
}

interface SaveAdminEventInput {
  readonly id?: string | null;
  readonly title?: string;
  readonly slug?: string;
  readonly category?: string;
  readonly startsAt?: string;
  readonly endsAt?: string | null;
  readonly capacity?: number | null;
  readonly status?: AdminEvent["status"];
  readonly featured?: boolean;
  readonly repeating?: boolean;
  readonly notes?: string | null;
}

export const listAdminEvents = createServerFn({ method: "GET" })
  .validator((data: EventListInput = {}) => data)
  .handler(async ({ data }) => {
    const { MysqlEventsRepository } = await import("../server/repositories/mysql");
    const { requireAdminServerPermission } = await import("./server-permissions");
    await requireAdminServerPermission("events.view");
    const events = await new MysqlEventsRepository().list({
      search: data.search,
      status: data.status,
      category: data.category,
      includeDeleted: data.includeDeleted,
      limit: 50,
    });
    return events.map(toAdminEvent);
  });

export const saveAdminEvent = createServerFn({ method: "POST" })
  .validator((data: SaveAdminEventInput) => data)
  .handler(async ({ data }) => {
    const title = data.title?.trim();
    const category = data.category?.trim();
    const startsAt = data.startsAt?.trim();
    if (!title) return { ok: false, message: "Event title is required." };
    if (!category) return { ok: false, message: "Event category is required." };
    if (!startsAt) return { ok: false, message: "Event start date and time are required." };

    const slug = normaliseSlug(data.slug || title);
    if (!slug) return { ok: false, message: "Event slug is required." };

    const { MysqlAuditLogRepository, MysqlEventsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerAnyPermission } = await import("./server-permissions");
    const principal = await requireAdminServerAnyPermission(
      data.id ? ["events.edit", "events.delete"] : ["events.create", "events.delete"],
    );
    const eventsRepository = new MysqlEventsRepository();
    const saved = data.id
      ? await eventsRepository.update({
          id: data.id,
          title,
          slug,
          category,
          startsAt,
          endsAt: data.endsAt,
          capacity: data.capacity,
          status: data.status ?? "draft",
          featured: data.featured,
          repeating: data.repeating,
          notes: data.notes,
        })
      : await eventsRepository.create({
          title,
          slug,
          category,
          startsAt,
          endsAt: data.endsAt,
          capacity: data.capacity,
          status: data.status ?? "draft",
          featured: data.featured,
          repeating: data.repeating,
          notes: data.notes,
        });

    if (!saved) return { ok: false, message: "Event record could not be saved." };
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: data.id ? "events.event.updated" : "events.event.created",
      moduleCode: "events",
      recordType: "event",
      recordId: saved.id,
      outcome: "success",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: { title: saved.title, slug: saved.slug, status: saved.status },
    });
    return { ok: true, message: "Event saved.", event: toAdminEvent(saved) };
  });

export const deleteAdminEvent = createServerFn({ method: "POST" })
  .validator((data: { id?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "Event id is required." };
    const { MysqlAuditLogRepository, MysqlEventsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerPermission } = await import("./server-permissions");
    const principal = await requireAdminServerPermission("events.delete");
    const eventsRepository = new MysqlEventsRepository();
    const event = await eventsRepository.findById(data.id);
    if (!event || event.deletedAt) return { ok: false, message: "Event was not found." };
    const deleted = await eventsRepository.softDelete(data.id);
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "events.event.deleted",
      moduleCode: "events",
      recordType: "event",
      recordId: data.id,
      outcome: deleted ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: { title: event.title, slug: event.slug },
    });
    return deleted
      ? { ok: true, message: "Event deleted." }
      : { ok: false, message: "Event could not be deleted." };
  });

export const restoreAdminEvent = createServerFn({ method: "POST" })
  .validator((data: { id?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.id) return { ok: false, message: "Event id is required." };
    const { MysqlAuditLogRepository, MysqlEventsRepository } =
      await import("../server/repositories/mysql");
    const { getRuntimeRequestContext } = await import("../server/auth/auth-runtime");
    const { requireAdminServerAnyPermission } = await import("./server-permissions");
    const principal = await requireAdminServerAnyPermission(["events.edit", "events.delete"]);
    const eventsRepository = new MysqlEventsRepository();
    const event = await eventsRepository.findById(data.id);
    if (!event || !event.deletedAt) return { ok: false, message: "Archived event was not found." };
    const restored = await eventsRepository.restore(data.id);
    const requestContext = getRuntimeRequestContext();
    await new MysqlAuditLogRepository().record({
      actorUserId: principal.userId,
      actionCode: "events.event.restored",
      moduleCode: "events",
      recordType: "event",
      recordId: data.id,
      outcome: restored ? "success" : "failed",
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      metadataJson: { title: event.title, slug: event.slug },
    });
    return restored
      ? { ok: true, message: "Event restored." }
      : { ok: false, message: "Event could not be restored." };
  });

export type AdminEventListFilters = EventFilters;

function toAdminEvent(event: {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly category: string;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly capacity: number | null;
  readonly bookedCount: number;
  readonly status: AdminEvent["status"];
  readonly featured: boolean;
  readonly repeating: boolean;
  readonly notes: string | null;
  readonly deletedAt: Date | null;
}): AdminEvent {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    category: event.category,
    startsAt: formatDateTime(event.startsAt),
    startsAtInput: formatDateTimeInput(event.startsAt),
    endsAt: event.endsAt ? formatDateTime(event.endsAt) : undefined,
    endsAtInput: event.endsAt ? formatDateTimeInput(event.endsAt) : undefined,
    capacity: event.capacity,
    booked: event.bookedCount,
    status: event.status,
    featured: event.featured,
    repeating: event.repeating,
    notes: event.notes ?? undefined,
    deletedAt: event.deletedAt ? formatDateTime(event.deletedAt) : undefined,
  };
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function formatDateTimeInput(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function normaliseSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 191);
}
