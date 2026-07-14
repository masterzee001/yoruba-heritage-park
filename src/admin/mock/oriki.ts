import type { AdminOrikiRequest } from "../types";

export const mockOrikiRequests: AdminOrikiRequest[] = [
  {
    isDemo: true,
    id: "or-001",
    reference: "YHP-O-0001",
    requestType: "family",
    visitorName: "Sample Enquirer A",
    visitorEmail: "enquirer.a@example.test",
    preferredFormat: "consultation",
    status: "under_review",
    culturalReviewStatus: "pending_authorised_review",
    appointmentState: "proposed_preview",
    assignedPractitionerPlaceholder: "Awaiting authorised assignment",
    internalNotes: "No Oríkì content has been generated.",
    deliveryStatePlaceholder: "Not yet published",
    createdAt: "2026-07-13T11:22:00Z",
    timeline: [
      {
        id: "ort-001",
        time: "2026-07-13T11:22:00Z",
        title: "Request received in preview",
        detail: "No cultural approval or visitor communication has occurred.",
      },
    ],
  },
  {
    isDemo: true,
    id: "or-002",
    reference: "YHP-O-0002",
    requestType: "personal",
    visitorName: "Sample Visitor B",
    visitorEmail: "visitor.b@example.test",
    preferredFormat: "written_summary",
    status: "awaiting_information",
    culturalReviewStatus: "not_started",
    appointmentState: "not_scheduled",
    assignedPractitionerPlaceholder: "Awaiting authorised assignment",
    internalNotes: "Pending operational confirmation.",
    deliveryStatePlaceholder: "Not yet published",
    createdAt: "2026-07-12T09:45:00Z",
    timeline: [
      {
        id: "ort-002",
        time: "2026-07-12T09:45:00Z",
        title: "Preview request opened",
        detail: "Additional visitor information is required before any real review.",
      },
    ],
  },
];
