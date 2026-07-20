/**
 * Central project / feature status.
 *
 * Client-handover production capabilities. Provider-backed features are only
 * enabled here when their server-side production configuration is present.
 */

export type ContentMode = "preview" | "staging" | "production";

export interface ProjectStatus {
  readonly contentMode: ContentMode;
  readonly bookingEnabled: boolean;
  readonly paymentEnabled: boolean;
  readonly sosLiveEnabled: boolean;
  readonly sosAdminVisible: boolean;
  readonly sosNotificationsEnabled: boolean;
  readonly showPendingInformation: boolean;
  readonly authenticationEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly whatsappEnabled: boolean;
  readonly geolocationLiveEnabled: boolean;
  readonly ticketQrEnabled: boolean;
  readonly mediaUploadEnabled: boolean;
}

export const projectStatus: ProjectStatus = {
  contentMode: "production",
  bookingEnabled: true,
  paymentEnabled: true,
  sosLiveEnabled: false,
  sosAdminVisible: false,
  sosNotificationsEnabled: false,
  showPendingInformation: false,
  authenticationEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: false,
  geolocationLiveEnabled: false,
  ticketQrEnabled: false,
  mediaUploadEnabled: false,
};

export const isPreviewContent = projectStatus.contentMode === "preview";
export const isPreviewMode = () => projectStatus.contentMode === "preview";
