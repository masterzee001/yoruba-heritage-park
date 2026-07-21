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

export interface EmailDeliveryProbeResult {
  readonly ok: boolean;
  readonly message: string;
  readonly diagnostics: EmailDeliveryDiagnostics;
}

export interface EmailDeliveryDiagnostics {
  readonly ready: boolean;
  readonly deliveryMode: "disabled" | "smtp" | "invalid";
  readonly statusLabel: string;
  readonly missingConfiguration: string[];
  readonly invalidConfiguration: string[];
  readonly fromAddressConfigured: boolean;
  readonly adminAddressConfigured: boolean;
  readonly publicBaseUrlConfigured: boolean;
  readonly smtpHost?: string;
  readonly smtpPort?: number;
  readonly smtpSecure?: boolean;
}

interface EmailTransport {
  verify?(): Promise<true | string>;
  sendMail(message: EmailMessage): Promise<{ readonly messageId?: string }>;
}

interface EmailMessage {
  readonly from: string;
  readonly to: string;
  readonly replyTo?: string;
  readonly envelope?: {
    readonly from: string;
    readonly to: string;
  };
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
  const result = await context.transport.sendMail(
    buildEmailMessage(context, { to: input.toEmail, subject, text, html }),
  );

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
  const result = await context.transport.sendMail(
    buildEmailMessage(context, { to: input.toEmail, subject, text, html }),
  );

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
  const result = await context.transport.sendMail(
    buildEmailMessage(context, {
      to: resolveAdminRecipient(context.env.email.adminAddress, context.env.email.fromAddress),
      subject,
      text,
      html,
    }),
  );

  return {
    status: "sent",
    message: "Email notification sent.",
    providerMessageId: result.messageId,
  };
}

export function inspectEmailDeliveryConfiguration(
  source?: NodeJS.ProcessEnv,
): EmailDeliveryDiagnostics {
  try {
    const env = getServerEnv({ source });
    const missingConfiguration = [
      ...(!env.email.fromAddress ? ["EMAIL_FROM_ADDRESS"] : []),
      ...(!env.email.smtp.host ? ["SMTP_HOST"] : []),
      ...(!env.email.smtp.user ? ["SMTP_USER"] : []),
      ...(!env.email.smtp.password ? ["SMTP_PASSWORD"] : []),
    ];
    const ready = env.email.deliveryMode === "smtp" && missingConfiguration.length === 0;
    return {
      ready,
      deliveryMode: env.email.deliveryMode,
      statusLabel: ready
        ? "SMTP ready"
        : env.email.deliveryMode === "disabled"
          ? "Disabled by EMAIL_DELIVERY_MODE"
          : "SMTP configuration incomplete",
      missingConfiguration,
      invalidConfiguration: [],
      fromAddressConfigured: Boolean(env.email.fromAddress),
      adminAddressConfigured: Boolean(env.email.adminAddress),
      publicBaseUrlConfigured: Boolean(env.email.publicBaseUrl),
      smtpHost: env.email.smtp.host,
      smtpPort: env.email.smtp.port,
      smtpSecure: env.email.smtp.secure,
    };
  } catch (error) {
    if (error instanceof ServerEnvError) {
      const env = source ?? process.env;
      const deliveryMode = env.EMAIL_DELIVERY_MODE === "smtp" ? "smtp" : "invalid";
      return {
        ready: false,
        deliveryMode,
        statusLabel: error.missingVariables.length
          ? "SMTP configuration incomplete"
          : "Email environment validation failed",
        missingConfiguration: error.missingVariables,
        invalidConfiguration: error.invalidVariables,
        fromAddressConfigured: Boolean(env.EMAIL_FROM_ADDRESS?.trim()),
        adminAddressConfigured: Boolean(env.EMAIL_ADMIN_ADDRESS?.trim()),
        publicBaseUrlConfigured: Boolean(env.EMAIL_PUBLIC_BASE_URL?.trim()),
        smtpHost: env.SMTP_HOST?.trim() || undefined,
        smtpPort: Number(env.SMTP_PORT || 587),
        smtpSecure: ["1", "true", "yes", "on"].includes(
          String(env.SMTP_SECURE ?? "")
            .trim()
            .toLowerCase(),
        ),
      };
    }
    throw error;
  }
}

export async function verifyEmailDeliveryTransport(
  options: EmailDeliveryOptions = {},
): Promise<EmailDeliveryProbeResult> {
  const diagnostics = inspectEmailDeliveryConfiguration(options.env);
  const context = resolveEmailContext(options);
  if (!context) {
    return {
      ok: false,
      message: diagnostics.statusLabel,
      diagnostics,
    };
  }
  if (!context.transport.verify) {
    return {
      ok: true,
      message: "SMTP transport is configured. Runtime verification is not available.",
      diagnostics,
    };
  }

  await context.transport.verify();
  return {
    ok: true,
    message: "SMTP login and transport verification succeeded.",
    diagnostics,
  };
}

export async function sendEmailDeliveryTest(
  toEmail?: string,
  options: EmailDeliveryOptions = {},
): Promise<EmailDeliveryResult> {
  const context = resolveEmailContext(options);
  if (!context) {
    return {
      status: "skipped",
      message:
        "Email delivery is disabled or SMTP configuration is incomplete. No message was sent.",
    };
  }

  const recipient = toEmail?.trim()
    ? toEmail.trim()
    : resolveAdminRecipient(context.env.email.adminAddress, context.env.email.fromAddress);
  const sentAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date());
  const result = await context.transport.sendMail(
    buildEmailMessage(context, {
      to: recipient,
      subject: "Yoruba Heritage Park email delivery test",
      text: [
        "This is a Yoruba Heritage Park production email delivery test.",
        `Sent at: ${sentAt}`,
        "",
        "If this message arrived, SMTP authentication and outbound delivery are working from the application server.",
      ].join("\n"),
      html: [
        "<p>This is a Yoruba Heritage Park production email delivery test.</p>",
        `<p>Sent at: ${escapeHtml(sentAt)}</p>`,
        "<p>If this message arrived, SMTP authentication and outbound delivery are working from the application server.</p>",
      ].join(""),
    }),
  );

  return {
    status: "sent",
    message: `Email test sent to ${recipient}. Check the inbox and spam folder for final delivery.`,
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
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

function buildEmailMessage(
  context: {
    readonly env: ReturnType<typeof getServerEnv>;
  },
  message: Pick<EmailMessage, "to" | "subject" | "text" | "html">,
): EmailMessage {
  const fromAddress = context.env.email.fromAddress;
  const smtpUser = context.env.email.smtp.user;
  const envelopeFrom = resolveEnvelopeSender(smtpUser, fromAddress);
  return {
    from: formatFromAddress(fromAddress, context.env.email.fromName),
    replyTo: fromAddress && fromAddress !== envelopeFrom ? fromAddress : undefined,
    envelope: {
      from: envelopeFrom,
      to: message.to,
    },
    ...message,
  };
}

function resolveEnvelopeSender(user: string | undefined, fromAddress: string | undefined): string {
  if (user && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) return user;
  return fromAddress ?? user ?? "";
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
