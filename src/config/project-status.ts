/**
 * Central project / feature status.
 *
 * All operational features are off in preview mode. Future backend,
 * authentication and integration work should update this module instead of
 * scattering local flags through components.
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
  contentMode: "preview",
  bookingEnabled: true,
  paymentEnabled: false,
  sosLiveEnabled: false,
  sosAdminVisible: false,
  sosNotificationsEnabled: false,
  showPendingInformation: true,
  authenticationEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  geolocationLiveEnabled: false,
  ticketQrEnabled: false,
  mediaUploadEnabled: false,
};

export const isPreviewContent = projectStatus.contentMode === "preview";
export const isPreviewMode = () => projectStatus.contentMode === "preview";
