import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const publicBookingSchema = z.object({
  ticketId: z.string().trim().min(1).max(100),
  ticketLabel: z.string().trim().min(1).max(100),
  visitDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  visitTime: z.string().trim().min(1).max(20),
  adults: z.number().int().min(0).max(100),
  children: z.number().int().min(0).max(100),
  durationOfStayDays: z.number().int().min(1).max(365),
  groupCategory: z.string().trim().min(1).max(100),
  addTourBus: z.boolean(),
  visitorName: z.string().trim().min(2).max(191),
  visitorEmail: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(80),
  emergencyContact: z.string().trim().min(3).max(120),
  countryOfOrigin: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(1000).optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

export const submitPublicBookingRequest = createServerFn({ method: "POST" })
  .validator((data: PublicBookingInput) => data)
  .handler(async ({ data }) => {
    const { projectStatus } = await import("../config/project-status");
    if (!projectStatus.bookingEnabled) {
      return {
        ok: false,
        message:
          "Booking requests are not active yet. Details will be published following operational confirmation.",
      };
    }

    const result = publicBookingSchema.safeParse(data);
    if (!result.success) {
      return {
        ok: false,
        message: "Please complete the required booking details before submitting.",
      };
    }

    const input = result.data;
    const guests = input.adults + input.children;
    if (guests < 1) {
      return { ok: false, message: "Please include at least one visitor." };
    }

    const { MysqlBookingsRepository } = await import("../server/repositories/mysql");
    const booking = await new MysqlBookingsRepository().create({
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail,
      countryOfOrigin: input.countryOfOrigin,
      bookingType: input.ticketLabel,
      visitDate: input.visitDate,
      durationOfStayDays: input.durationOfStayDays,
      guests,
      amountMinor: 0,
      currency: "NGN",
      paymentState: "not_applicable",
      status: "pending",
      source: "website",
      notes: [
        `Requested time: ${input.visitTime}`,
        `Adults: ${input.adults}`,
        `Children: ${input.children}`,
        `Group category: ${input.groupCategory}`,
        `Designated tour bus requested: ${input.addTourBus ? "Yes" : "No"}`,
        `Phone: ${input.phone}`,
        `Emergency contact: ${input.emergencyContact}`,
        input.notes ? `Visitor notes: ${input.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return {
      ok: true,
      reference: booking.reference,
      message: "Booking request received. The team will review availability before confirmation.",
    };
  });
