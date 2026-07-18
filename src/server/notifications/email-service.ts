import nodemailer from "nodemailer";

import { getServerEnv, ServerEnvError } from "../env/server-env";

export type AdminCredentialNoticePurpose = "invitation" | "password_reset";

export interface AdminCredentialNoticeInput {
  readonly toEmail: string;
  readonly displayName: string;
  readonly purpose: AdminCredentialNoticePurpose;
}

export interface BookingAcknowledgementNoticeInput {
  readonly toEmail: string;
  readonly visitorName: string;
  readonly bookingReference: string;
  readonly bookingType: string;
  readonly requestedVisitDate: string;
  readonly guests: number;
}

export interface NewBookingNotificationInput extends Omit<
  BookingAcknowledgementNoticeInput,
  "toEmail"
> {
  readonly visitorEmail: string;
}

export interface EmailDeliveryResult {
  readonly status: "sent" | "skipped";
  readonly message: string;
  readonly providerMessageId?: string;
}

export interface EmailDeliveryOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly transportFactory?: EmailTransportFactory;
}

interface EmailTransport {
  sendMail(message: EmailMessage): Promise<{ readonly messageId?: string }>;
}

interface EmailMessage {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

interface EmailTransportConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly password: string;
}

type EmailTransportFactory = (config: EmailTransportConfig) => EmailTransport;

export async function sendAdminCredentialNotice(
  input: AdminCredentialNoticeInput,
  options: EmailDeliveryOptions = {},
): Promise<EmailDeliveryResult> {
  const context = resolveEmailContext(options);
  if (!context) {
    return {
      status: "skipped",
      message: "Email delivery is disabled. No message was sent.",
    };
  }

  const { subject, text, html } = buildAdminCredentialNotice(input, {
    loginUrl: buildLoginUrl(context.env.email.publicBaseUrl),
  });
  const result = await context.transport.sendMail({
    from: formatFromAddress(context.env.email.fromAddress, context.env.email.fromName),
    to: input.toEmail,
    subject,
    text,
    html,
  });

  return {
    status: "sent",
    message: "Email notification sent.",
    providerMessageId: result.messageId,
  };
}

export async function sendBookingAcknowledgementNotice(
  input: BookingAcknowledgementNoticeInput,
  options: EmailDeliveryOptions = {},
): Promise<EmailDeliveryResult> {
  const context = resolveEmailContext(options);
  if (!context) {
    return {
      status: "skipped",
      message: "Email delivery is disabled. No message was sent.",
    };
  }

  const { subject, text, html } = buildBookingAcknowledgementNotice(input, {
    statusUrl: buildBookingStatusUrl(context.env.email.publicBaseUrl, input.bookingReference),
  });
  const result = await context.transport.sendMail({
    from: formatFromAddress(context.env.email.fromAddress, context.env.email.fromName),
    to: input.toEmail,
    subject,
    text,
    html,
  });

  return {
    status: "sent",
    message: "Email notification sent.",
    providerMessageId: result.messageId,
  };
}

export async function sendNewBookingNotification(
  input: NewBookingNotificationInput,
  options: EmailDeliveryOptions = {},
): Promise<EmailDeliveryResult> {
  const context = resolveEmailContext(options);
  if (!context) {
    return {
      status: "skipped",
      message: "Email delivery is disabled. No message was sent.",
    };
  }

  const { subject, text, html } = buildNewBookingNotification(input, {
    adminBookingsUrl: buildAdminBookingsUrl(
      context.env.email.publicBaseUrl,
      input.bookingReference,
    ),
  });
  const result = await context.transport.sendMail({
    from: formatFromAddress(context.env.email.fromAddress, context.env.email.fromName),
    to: resolveAdminRecipient(context.env.email.adminAddress, context.env.email.fromAddress),
    subject,
    text,
    html,
  });

  return {
    status: "sent",
    message: "Email notification sent.",
    providerMessageId: result.messageId,
  };
}

function resolveEmailContext(options: EmailDeliveryOptions): {
  readonly env: ReturnType<typeof getServerEnv>;
  readonly transport: EmailTransport;
} | null {
  const env = resolveServerEnv(options.env);
  if (!env || env.email.deliveryMode === "disabled") return null;

  const fromAddress = env.email.fromAddress?.trim();
  const host = env.email.smtp.host?.trim();
  const user = env.email.smtp.user?.trim();
  const password = env.email.smtp.password?.trim();
  if (!fromAddress || !host || !user || !password) return null;

  const transportFactory = options.transportFactory ?? createDefaultTransport;
  return {
    env,
    transport: transportFactory({
      host,
      port: env.email.smtp.port,
      secure: env.email.smtp.secure,
      user,
      password,
    }),
  };
}

function resolveServerEnv(source?: NodeJS.ProcessEnv) {
  try {
    return getServerEnv({ source });
  } catch (error) {
    if (error instanceof ServerEnvError && isMissingEmailConfiguration(error.missingVariables)) {
      return null;
    }
    throw error;
  }
}

function isMissingEmailConfiguration(missingVariables: string[]): boolean {
  return missingVariables.some((name) =>
    ["EMAIL_FROM_ADDRESS", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"].includes(name),
  );
}

function createDefaultTransport(config: EmailTransportConfig): EmailTransport {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

function buildAdminCredentialNotice(
  input: AdminCredentialNoticeInput,
  options: { readonly loginUrl: string },
): { readonly subject: string; readonly text: string; readonly html: string } {
  const isInvitation = input.purpose === "invitation";
  const subject = isInvitation
    ? "Yoruba Heritage Park administrator access"
    : "Yoruba Heritage Park administrator password updated";
  const intro = isInvitation
    ? "Your Yoruba Heritage Park administrator access has been prepared."
    : "Your Yoruba Heritage Park administrator password has been updated by an authorised administrator.";
  const credentialLine = isInvitation
    ? "For security, your password will be provided separately by an authorised administrator."
    : "Use the new password provided separately by an authorised administrator.";
  const text = [
    `Hello ${input.displayName},`,
    "",
    intro,
    credentialLine,
    `Login: ${options.loginUrl}`,
    "",
    "If you were not expecting this message, contact the project administrator before signing in.",
  ].join("\n");
  const html = [
    `<p>Hello ${escapeHtml(input.displayName)},</p>`,
    `<p>${escapeHtml(intro)}</p>`,
    `<p>${escapeHtml(credentialLine)}</p>`,
    `<p><a href="${escapeAttribute(options.loginUrl)}">Open administrator login</a></p>`,
    "<p>If you were not expecting this message, contact the project administrator before signing in.</p>",
  ].join("");
  return { subject, text, html };
}

function buildBookingAcknowledgementNotice(
  input: BookingAcknowledgementNoticeInput,
  options: { readonly statusUrl: string },
): { readonly subject: string; readonly text: string; readonly html: string } {
  const subject = `Yoruba Heritage Park booking received - ${input.bookingReference}`;
  const text = [
    `Hello ${input.visitorName},`,
    "",
    "Your booking request has been received and is pending administrative review.",
    "",
    `Reference: ${input.bookingReference}`,
    `Booking type: ${input.bookingType}`,
    `Requested visit date: ${input.requestedVisitDate}`,
    `Guests: ${input.guests}`,
    "Status: pending administrative review",
    "Payment is not yet confirmed.",
    `Booking status: ${options.statusUrl}`,
  ].join("\n");
  const html = [
    `<p>Hello ${escapeHtml(input.visitorName)},</p>`,
    "<p>Your booking request has been received and is pending administrative review.</p>",
    "<dl>",
    `<dt>Reference</dt><dd>${escapeHtml(input.bookingReference)}</dd>`,
    `<dt>Booking type</dt><dd>${escapeHtml(input.bookingType)}</dd>`,
    `<dt>Requested visit date</dt><dd>${escapeHtml(input.requestedVisitDate)}</dd>`,
    `<dt>Guests</dt><dd>${escapeHtml(String(input.guests))}</dd>`,
    "</dl>",
    "<p>Status: pending administrative review</p>",
    "<p>Payment is not yet confirmed.</p>",
    `<p><a href="${escapeAttribute(options.statusUrl)}">Check booking status</a></p>`,
  ].join("");
  return { subject, text, html };
}

function buildNewBookingNotification(
  input: NewBookingNotificationInput,
  options: { readonly adminBookingsUrl: string },
): { readonly subject: string; readonly text: string; readonly html: string } {
  const subject = `New Yoruba Heritage Park booking - ${input.bookingReference}`;
  const text = [
    "A new booking request has been received.",
    "",
    `Reference: ${input.bookingReference}`,
    `Visitor name: ${input.visitorName}`,
    `Visitor email: ${input.visitorEmail}`,
    `Phone number: ${input.phone}`,
    `Booking type: ${input.bookingType}`,
    `Requested visit date: ${input.requestedVisitDate}`,
    `Guests: ${input.guests}`,
    `Admin bookings: ${options.adminBookingsUrl}`,
  ].join("\n");
  const html = [
    "<p>A new booking request has been received.</p>",
    "<dl>",
    `<dt>Reference</dt><dd>${escapeHtml(input.bookingReference)}</dd>`,
    `<dt>Visitor name</dt><dd>${escapeHtml(input.visitorName)}</dd>`,
    `<dt>Visitor email</dt><dd>${escapeHtml(input.visitorEmail)}</dd>`,
    `<dt>Phone number</dt><dd>${escapeHtml(input.phone)}</dd>`,
    `<dt>Booking type</dt><dd>${escapeHtml(input.bookingType)}</dd>`,
    `<dt>Requested visit date</dt><dd>${escapeHtml(input.requestedVisitDate)}</dd>`,
    `<dt>Guests</dt><dd>${escapeHtml(String(input.guests))}</dd>`,
    "</dl>",
    `<p><a href="${escapeAttribute(options.adminBookingsUrl)}">Open admin bookings</a></p>`,
  ].join("");
  return { subject, text, html };
}

function buildLoginUrl(publicBaseUrl: string | undefined): string {
  return buildPublicUrl(publicBaseUrl, "/staff-access");
}

function buildBookingStatusUrl(
  publicBaseUrl: string | undefined,
  bookingReference: string,
): string {
  return buildPublicUrl(
    publicBaseUrl,
    `/tickets?bookingReference=${encodeURIComponent(bookingReference)}`,
  );
}

function buildAdminBookingsUrl(
  publicBaseUrl: string | undefined,
  bookingReference: string,
): string {
  return buildPublicUrl(
    publicBaseUrl,
    `/admin/bookings?search=${encodeURIComponent(bookingReference)}`,
  );
}

function buildPublicUrl(publicBaseUrl: string | undefined, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!publicBaseUrl) return normalizedPath;
  return `${publicBaseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

function resolveAdminRecipient(
  adminAddress: string | undefined,
  fromAddress: string | undefined,
): string {
  return adminAddress?.trim() || fromAddress?.trim() || "";
}

function formatFromAddress(address: string | undefined, name: string | undefined): string {
  if (!address) return "";
  if (!name) return address;
  return `"${name.replace(/"/g, "'")}" <${address}>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
