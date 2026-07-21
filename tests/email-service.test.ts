import { describe, expect, test } from "bun:test";

import {
  inspectEmailDeliveryConfiguration,
  sendAdminCredentialNotice,
  sendBookingAcknowledgementNotice,
  sendNewBookingNotification,
} from "../src/server/notifications/email-service";

describe("email notification service", () => {
  test("skips delivery while email mode is disabled", async () => {
    const previousMode = process.env.EMAIL_DELIVERY_MODE;
    process.env.EMAIL_DELIVERY_MODE = "disabled";

    try {
      const result = await sendAdminCredentialNotice({
        toEmail: "admin@example.test",
        displayName: "Admin User",
        purpose: "invitation",
      });

      expect(result.status).toBe("skipped");
      expect(result.message).toContain("disabled");
    } finally {
      if (previousMode === undefined) {
        delete process.env.EMAIL_DELIVERY_MODE;
      } else {
        process.env.EMAIL_DELIVERY_MODE = previousMode;
      }
    }
  });

  test("sends booking acknowledgement emails with the configured SMTP transport", async () => {
    const sentMessages: Array<Record<string, string>> = [];
    const result = await sendBookingAcknowledgementNotice(
      {
        toEmail: "visitor@example.test",
        visitorName: "Visitor Name",
        bookingReference: "YHP-B-20260718-ABC123",
        bookingType: "Prayer Walk",
        requestedVisitDate: "18 Jul 2026",
        guests: 4,
      },
      {
        env: makeEmailEnv(),
        transportFactory: () => ({
          async sendMail(message) {
            sentMessages.push({
              from: message.from,
              to: message.to,
              subject: message.subject,
              text: message.text,
              html: message.html,
            });
            return { messageId: "message-1" };
          },
        }),
      },
    );

    expect(result.status).toBe("sent");
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].to).toBe("visitor@example.test");
    expect(sentMessages[0].subject).toContain("YHP-B-20260718-ABC123");
    expect(sentMessages[0].text).toContain("pending administrative review");
    expect(sentMessages[0].text).toContain("Booking status");
  });

  test("sends administrator booking notifications", async () => {
    const sentMessages: Array<Record<string, string>> = [];
    const result = await sendNewBookingNotification(
      {
        visitorEmail: "visitor@example.test",
        visitorName: "Visitor Name",
        phone: "+2348000000000",
        bookingReference: "YHP-B-20260718-ABC124",
        bookingType: "Prayer Walk",
        requestedVisitDate: "18 Jul 2026",
        guests: 4,
      },
      {
        env: makeEmailEnv({ EMAIL_ADMIN_ADDRESS: "admin@example.test" }),
        transportFactory: () => ({
          async sendMail(message) {
            sentMessages.push({
              from: message.from,
              to: message.to,
              subject: message.subject,
              text: message.text,
              html: message.html,
            });
            return { messageId: "message-2" };
          },
        }),
      },
    );

    expect(result.status).toBe("sent");
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].to).toBe("admin@example.test");
    expect(sentMessages[0].subject).toContain("YHP-B-20260718-ABC124");
    expect(sentMessages[0].text).toContain("visitor@example.test");
    expect(sentMessages[0].text).toContain("Admin bookings");
  });

  test("reports missing SMTP configuration without exposing secrets", () => {
    const result = inspectEmailDeliveryConfiguration({
      EMAIL_DELIVERY_MODE: "smtp",
      EMAIL_FROM_ADDRESS: "admin@example.test",
      SMTP_HOST: "smtp.example.test",
    });

    expect(result.ready).toBe(false);
    expect(result.statusLabel).toContain("incomplete");
    expect(result.missingConfiguration).toContain("SMTP_USER");
    expect(result.missingConfiguration).toContain("SMTP_PASSWORD");
    expect(JSON.stringify(result)).not.toContain("smtp-password");
  });
});

function makeEmailEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    EMAIL_DELIVERY_MODE: "smtp",
    EMAIL_FROM_ADDRESS: "admin@example.test",
    EMAIL_FROM_NAME: "Yoruba Heritage Park",
    EMAIL_PUBLIC_BASE_URL: "https://preview.example.test",
    SMTP_HOST: "smtp.example.test",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "smtp-user",
    SMTP_PASSWORD: "smtp-password",
    ...overrides,
  };
}
