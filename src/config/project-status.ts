export type ContentMode = "preview" | "production";

export type ProjectStatus = {
  contentMode: ContentMode;
  bookingEnabled: boolean;
  paymentEnabled: boolean;
  sosLiveEnabled: boolean;
  showPendingInformation: boolean;
};

export const projectStatus: ProjectStatus = {
  contentMode: "preview",
  bookingEnabled: false,
  paymentEnabled: false,
  sosLiveEnabled: false,
  showPendingInformation: true,
};

export const isPreviewContent = projectStatus.contentMode === "preview";
