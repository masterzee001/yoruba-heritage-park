/**
 * Central project / feature status.
 *
 * All operational features are OFF in preview mode. Codex will flip these
 * on when the real MySQL backend, authentication and integrations are wired
 * server-side. Route components and reusable notices must read from this
 * module — do not scatter local flags.
 */

export type ContentMode = "preview" | "staging" | "production";

export interface ProjectStatus {
  readonly contentMode: ContentMode;
  readonly bookingEnabled: boolean;
  readonly paymentEnabled: boolean;
  readonly sosLiveEnabled: boolean;
  readonly authenticationEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly whatsappEnabled: boolean;
  readonly geolocationLiveEnabled: boolean;
  readonly ticketQrEnabled: boolean;
  readonly mediaUploadEnabled: boolean;
}

export const projectStatus: ProjectStatus = {
  contentMode: "preview",
  bookingEnabled: false,
  paymentEnabled: false,
  sosLiveEnabled: false,
  authenticationEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  geolocationLiveEnabled: false,
  ticketQrEnabled: false,
  mediaUploadEnabled: false,
} as const;

export const isPreviewMode = () => projectStatus.contentMode === "preview";
