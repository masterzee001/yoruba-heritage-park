import type { AdminCeremonyEnquiry } from "../types";

export const mockCeremonyEnquiries: AdminCeremonyEnquiry[] = [
  {
    isDemo: true,
    id: "ce-001",
    reference: "YHP-C-0001",
    ceremonyType: "naming_ceremony",
    contactName: "Sample Family",
    contactEmail: "family@example.test",
    preferredDate: "2026-09-18",
    guestEstimate: "Pending confirmation",
    venuePreference: "Pending operational confirmation",
    requirements: "Awaiting authorised content",
    proposalState: "not_started",
    assignedCoordinatorPlaceholder: "Awaiting authorised assignment",
    status: "in_review",
    internalNotes: "No package, price or venue commitment has been created.",
    createdAt: "2026-07-13T14:10:00Z",
    timeline: [
      {
        id: "cet-001",
        time: "2026-07-13T14:10:00Z",
        title: "Preview enquiry received",
        detail: "Official confirmation has not been issued.",
      },
    ],
  },
  {
    isDemo: true,
    id: "ce-002",
    reference: "YHP-C-0002",
    ceremonyType: "prayer_gathering",
    contactName: "Sample Group",
    contactEmail: "group@example.test",
    venuePreference: "Available following official approval",
    requirements: "Pending operational confirmation",
    proposalState: "draft_preview",
    assignedCoordinatorPlaceholder: "Awaiting authorised assignment",
    status: "date_proposed",
    internalNotes: "Date proposal is preview-only.",
    createdAt: "2026-07-12T13:05:00Z",
    timeline: [
      {
        id: "cet-002",
        time: "2026-07-12T13:05:00Z",
        title: "Preview date discussion logged",
        detail: "No official ceremony confirmation exists.",
      },
    ],
  },
];
