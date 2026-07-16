import nodemailer from "nodemailer";

import { getServerEnv } from "../env/server-env";

export type AdminCredentialNoticePurpose = "invitation" | "password_reset";

export interface AdminCredentialNoticeInput {
  readonly toEmail: string;
  readonly displayName: string;
  readonly purpose: AdminCredentialNoticePurpose;
}

export interface EmailDeliveryResult {
  readonly status: "sent" | "skipped";
  readonly message: string;
  readonly providerMessageId?: string;
}

export async function sendAdminCredentialNotice(
  input: AdminCredentialNoticeInput,
): Promise<EmailDeliveryResult> {
  const env = getServerEnv();
  if (env.email.deliveryMode === "disabled") {
    return {
      status: "skipped",
      message: "Email delivery is disabled. No message was sent.",
    };
  }

  const { subject, text, html } = buildAdminCredentialNotice(input, {
    loginUrl: buildLoginUrl(env.email.publicBaseUrl),
  });
  const transporter = nodemailer.createTransport({
    host: env.email.smtp.host,
    port: env.email.smtp.port,
    secure: env.email.smtp.secure,
    auth: {
      user: env.email.smtp.user,
      pass: env.email.smtp.password,
    },
  });
  const from = formatFromAddress(env.email.fromAddress, env.email.fromName);
  const result = await transporter.sendMail({
    from,
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

function buildLoginUrl(publicBaseUrl: string | undefined): string {
  if (!publicBaseUrl) return "/staff-access";
  return `${publicBaseUrl.replace(/\/$/, "")}/staff-access`;
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
