import { describe, expect, test } from "bun:test";

import { sendBookingCreatedNotifications } from "../src/booking/booking-notifications";
import type { BookingRecord } from "../src/server/repositories";

describe("booking notification workflow", () => {
  test("continues when one booking email fails", async () => {
    const logEntries: Array<[string, unknown]> = [];
    const booking = makeBookingRecord();
    const callOrder: string[] = [];

    await sendBookingCreatedNotifications(booking, {
      logger: {
        error(message, details) {
          logEntries.push([message, details]);
        },
      },
      mailer: {
        async sendVisitorAcknowledgement() {
          callOrder.push("visitor");
          return { status: "sent", message: "Visitor email sent." };
        },
        async sendAdministratorNotice() {
          callOrder.push("admin");
          throw new Error("SMTP password secret-value failed");
        },
      },
    });

    expect(callOrder).toEqual(["visitor", "admin"]);
    expect(logEntries).toHaveLength(1);
    expect(String(logEntries[0][0])).toContain("administrator booking notification failed");
    expect(JSON.stringify(logEntries[0][1])).not.toContain("secret-value");
  });

  test("logs skipped booking emails for operational visibility", async () => {
    const warnEntries: Array<[string, unknown]> = [];
    const booking = makeBookingRecord();

    await sendBookingCreatedNotifications(booking, {
      logger: {
        error() {},
        warn(message, details) {
          warnEntries.push([message, details]);
        },
      },
      mailer: {
        async sendVisitorAcknowledgement() {
          return { status: "skipped", message: "Email delivery is disabled. No message was sent." };
        },
        async sendAdministratorNotice() {
          return { status: "skipped", message: "SMTP_PASSWORD missing" };
        },
      },
    });

    expect(warnEntries).toHaveLength(2);
    expect(String(warnEntries[0][0])).toContain("visitor booking acknowledgement skipped");
    expect(String(warnEntries[1][0])).toContain("administrator booking notification skipped");
  });
});

function makeBookingRecord(): BookingRecord {
  return {
    id: "booking_1",
    reference: "YHP-B-20260718-ABC125",
    visitorName: "Visitor Name",
    visitorEmail: "visitor@example.test",
    countryOfOrigin: "Nigeria",
    bookingType: "Prayer Walk",
    visitDate: new Date("2026-07-22T00:00:00.000Z"),
    durationOfStayDays: 2,
    guests: 4,
    amountMinor: 0,
    currency: "NGN",
    paymentState: "not_applicable",
    status: "pending",
    checkedInAt: null,
    source: "website",
    notes: null,
    internalNotes: null,
    createdAt: new Date("2026-07-18T00:00:00.000Z"),
    updatedAt: new Date("2026-07-18T00:00:00.000Z"),
    deletedAt: null,
  };
}
