import type { AdminStayOwnEnquiry } from "../types";

export const mockStayOwnEnquiries: AdminStayOwnEnquiry[] = [
  {
    isDemo: true,
    id: "so-001",
    reference: "YHP-SO-0001",
    visitorName: "Sample Property Enquirer",
    visitorEmail: "property@example.test",
    visitorPhone: "+234 000 000 0000",
    interest: "Model or hut interest pending official specification",
    preferredInspectionDate: "2026-10-04",
    inspectionState: "proposed_preview",
    buyerInterestState: "early_interest",
    followUpState: "pending_preview",
    assignedStaffPlaceholder: "Awaiting authorised assignment",
    documentState: "pending_authorised_documents",
    status: "inspection_proposed",
    internalNotes: "No property transaction, price or legal term has been created.",
    createdAt: "2026-07-12T10:15:00Z",
    timeline: [
      {
        id: "sot-001",
        time: "2026-07-12T10:15:00Z",
        title: "Preview enquiry received",
        detail: "Property transactions are outside the current system.",
      },
    ],
  },
  {
    isDemo: true,
    id: "so-002",
    reference: "YHP-SO-0002",
    visitorName: "Sample Visitor C",
    visitorEmail: "visitor.c@example.test",
    interest: "Information request only",
    inspectionState: "not_started",
    buyerInterestState: "information_requested",
    followUpState: "not_started",
    assignedStaffPlaceholder: "Awaiting authorised assignment",
    documentState: "not_available",
    status: "contact_review",
    internalNotes: "Awaiting authorised content.",
    createdAt: "2026-07-11T09:30:00Z",
    timeline: [
      {
        id: "sot-002",
        time: "2026-07-11T09:30:00Z",
        title: "Preview contact record created",
      },
    ],
  },
];
