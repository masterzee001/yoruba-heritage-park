import { createServerFn } from "@tanstack/react-start";

import type { AdminEvent, EventFilters } from "./types";

interface EventListInput {
  readonly search?: string;
  readonly status?: AdminEvent["status"] | "all";
  readonly category?: string;
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
      limit: 50,
    });
    return events.map(toAdminEvent);
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
}): AdminEvent {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    category: event.category,
    startsAt: formatDateTime(event.startsAt),
    endsAt: event.endsAt ? formatDateTime(event.endsAt) : undefined,
    capacity: event.capacity,
    booked: event.bookedCount,
    status: event.status,
    featured: event.featured,
    repeating: event.repeating,
    notes: event.notes ?? undefined,
  };
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}
