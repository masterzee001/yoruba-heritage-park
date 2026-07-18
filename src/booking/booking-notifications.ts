import type { BookingRecord } from "../server/repositories";
import {
  sendBookingAcknowledgementNotice,
  sendNewBookingNotification,
  type BookingAcknowledgementNoticeInput,
  type EmailDeliveryResult,
  type NewBookingNotificationInput,
} from "../server/notifications/email-service";

export interface BookingNotificationMailer {
  readonly sendVisitorAcknowledgement: (
    input: BookingAcknowledgementNoticeInput,
  ) => Promise<EmailDeliveryResult>;
  readonly sendAdministratorNotice: (
    input: NewBookingNotificationInput,
  ) => Promise<EmailDeliveryResult>;
}

export interface BookingNotificationOptions {
  readonly logger?: Pick<Console, "error">;
  readonly mailer?: BookingNotificationMailer;
}

const defaultMailer: BookingNotificationMailer = {
  sendVisitorAcknowledgement: sendBookingAcknowledgementNotice,
  sendAdministratorNotice: sendNewBookingNotification,
};

export async function sendBookingCreatedNotifications(
  booking: BookingRecord,
  options: BookingNotificationOptions = {},
): Promise<void> {
  const logger = options.logger ?? console;
  const mailer = options.mailer ?? defaultMailer;

  await sendNotification("visitor booking acknowledgement", logger, () =>
    mailer.sendVisitorAcknowledgement({
      toEmail: booking.visitorEmail,
      visitorName: booking.visitorName,
      bookingReference: booking.reference,
      bookingType: booking.bookingType,
      requestedVisitDate: formatBookingDate(booking.visitDate),
      guests: booking.guests,
    }),
  );

  await sendNotification("administrator booking notification", logger, () =>
    mailer.sendAdministratorNotice({
      visitorEmail: booking.visitorEmail,
      visitorName: booking.visitorName,
      bookingReference: booking.reference,
      bookingType: booking.bookingType,
      requestedVisitDate: formatBookingDate(booking.visitDate),
      guests: booking.guests,
    }),
  );
}

async function sendNotification(
  label: string,
  logger: Pick<Console, "error">,
  action: () => Promise<EmailDeliveryResult>,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    logger.error(`[booking-notifications] ${label} failed`, sanitiseEmailError(error));
  }
}

function sanitiseEmailError(error: unknown): Record<string, string> {
  const details: Record<string, string> = {};
  if (error instanceof Error) {
    if (error.name) details.name = error.name;
    if (error.message) details.message = redactSensitiveText(error.message);
  } else {
    details.message = redactSensitiveText(String(error));
  }
  const code = readStringProperty(error, "code");
  if (code) details.code = code;
  return details;
}

function readStringProperty(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/(password|secret|token|pass)(?:\s*[:=]\s*|\s+)[^\s,]+/gi, "$1=[redacted]")
    .replace(/(smtp_[a-z_]+)\s*[:=]\s*[^,\s]+/gi, "$1=[redacted]")
    .slice(0, 400);
}

function formatBookingDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}
