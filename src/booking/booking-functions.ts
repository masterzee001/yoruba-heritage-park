import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { formatPaymentAmount } from "../config/payment-currencies";
import type { BookingRecord, PaymentRecord } from "../server/repositories";

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

const publicStatusLookupSchema = z.object({
  reference: z.string().trim().min(3).max(191),
});

export interface PublicStatusLookupResult {
  readonly ok: boolean;
  readonly message: string;
  readonly kind?: "payment" | "booking";
  readonly reference?: string;
  readonly statusLabel?: string;
  readonly detail?: string;
  readonly amountLabel?: string;
  readonly providerLabel?: string;
  readonly verificationLabel?: string;
  readonly bookingReference?: string;
  readonly visitDateLabel?: string;
  readonly nextStep?: string;
}

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

export const lookupPublicBookingOrPaymentStatus = createServerFn({ method: "GET" })
  .validator((data: { reference?: string }) => data)
  .handler(async ({ data }): Promise<PublicStatusLookupResult> => {
    const result = publicStatusLookupSchema.safeParse(data);
    if (!result.success) {
      return {
        ok: false,
        message: "Enter a valid booking or payment reference.",
      };
    }

    const reference = result.data.reference.trim().toUpperCase();
    const { MysqlBookingsRepository, MysqlPaymentsRepository } =
      await import("../server/repositories/mysql");
    const paymentsRepository = new MysqlPaymentsRepository();
    const payment = await paymentsRepository.findByReference(reference);
    if (payment && !payment.deletedAt) return toPublicPaymentStatus(payment);

    const bookingsRepository = new MysqlBookingsRepository();
    const booking = await bookingsRepository.findByReference(reference);
    if (booking && !booking.deletedAt) {
      const payments = await paymentsRepository.listForBooking(booking.id);
      return toPublicBookingStatus(booking, payments);
    }

    return {
      ok: false,
      message:
        "No matching record was found. Check the reference and contact the administration team if the issue continues.",
    };
  });

function toPublicPaymentStatus(payment: PaymentRecord): PublicStatusLookupResult {
  const status = getPaymentStatusContent(payment);
  return {
    ok: true,
    kind: "payment",
    reference: payment.reference,
    statusLabel: status.label,
    detail: status.detail,
    amountLabel: formatPaymentAmount(payment.amountMinor, payment.currency),
    providerLabel: formatProviderLabel(payment.providerCode),
    verificationLabel: formatVerificationLabel(payment.verificationStatus),
    nextStep: status.nextStep,
    message: "Payment status found.",
  };
}

function toPublicBookingStatus(
  booking: BookingRecord,
  payments: PaymentRecord[],
): PublicStatusLookupResult {
  const latestPayment = payments
    .filter((payment) => !payment.deletedAt)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const status = getBookingStatusContent(booking, latestPayment);
  return {
    ok: true,
    kind: "booking",
    reference: booking.reference,
    statusLabel: status.label,
    detail: status.detail,
    amountLabel: latestPayment
      ? formatPaymentAmount(latestPayment.amountMinor, latestPayment.currency)
      : undefined,
    providerLabel: latestPayment ? formatProviderLabel(latestPayment.providerCode) : undefined,
    verificationLabel: latestPayment
      ? formatVerificationLabel(latestPayment.verificationStatus)
      : undefined,
    bookingReference: latestPayment?.reference,
    visitDateLabel: booking.visitDate.toISOString().slice(0, 10),
    nextStep: status.nextStep,
    message: "Booking status found.",
  };
}

function getPaymentStatusContent(payment: PaymentRecord): {
  readonly label: string;
  readonly detail: string;
  readonly nextStep: string;
} {
  if (payment.status === "successful") {
    return {
      label: "Payment verified",
      detail: "This payment has been verified by the administration team.",
      nextStep: "Keep this reference for your visit records.",
    };
  }
  if (payment.status === "failed" || payment.status === "abandoned") {
    return {
      label: "Payment not completed",
      detail: "This payment has not been confirmed as received.",
      nextStep: "Contact the administration team before attempting another payment.",
    };
  }
  if (payment.status === "refund_pending" || payment.status === "refunded") {
    return {
      label: payment.status === "refunded" ? "Payment refunded" : "Refund under review",
      detail: "This payment is linked to a refund workflow.",
      nextStep: "The administration team will provide any required follow-up.",
    };
  }
  return {
    label: "Payment awaiting verification",
    detail:
      "The payment request exists, but receipt is confirmed only after provider verification.",
    nextStep: "If you just returned from checkout, allow time for provider verification.",
  };
}

function getBookingStatusContent(
  booking: BookingRecord,
  latestPayment: PaymentRecord | undefined,
): {
  readonly label: string;
  readonly detail: string;
  readonly nextStep: string;
} {
  if (booking.status === "confirmed") {
    return {
      label: "Booking confirmed",
      detail: "This booking has been confirmed by the administration team.",
      nextStep: "Keep your booking reference for arrival.",
    };
  }
  if (booking.status === "cancelled") {
    return {
      label: "Booking cancelled",
      detail: "This booking is no longer active.",
      nextStep: "Contact the administration team if this status is unexpected.",
    };
  }
  if (latestPayment) {
    const paymentStatus = getPaymentStatusContent(latestPayment);
    return {
      label: `Booking ${booking.status.replace(/_/g, " ")}`,
      detail: `Latest payment: ${paymentStatus.label}.`,
      nextStep: paymentStatus.nextStep,
    };
  }
  return {
    label: "Booking under review",
    detail: "This booking request is waiting for administrator review.",
    nextStep: "The team will confirm availability and payment instructions before final approval.",
  };
}

function formatProviderLabel(providerCode: string): string {
  if (providerCode === "paypal") return "PayPal";
  if (providerCode === "paystack") return "Paystack";
  if (providerCode === "stripe") return "Stripe";
  return providerCode;
}

function formatVerificationLabel(status: PaymentRecord["verificationStatus"]): string {
  if (status === "preview_verified") return "Verified";
  if (status === "review_required") return "Review required";
  if (status === "not_applicable") return "Not applicable";
  return "Awaiting provider verification";
}
