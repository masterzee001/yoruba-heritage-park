import type { AdminAppointment } from "../types";

export const mockAppointments: AdminAppointment[] = [
  {
    isDemo: true,
    id: "ap-001",
    reference: "YHP-A-0001",
    visitorName: "Sample Enquirer A",
    visitorEmail: "enquirer.a@example.test",
    category: "oriki",
    requestedDate: "2026-08-12",
    scheduledFor: "2026-08-12T11:00:00+01:00",
    status: "scheduled",
    assignedTo: "Sample Coordinator",
    notes: "Oríkì consultation request. Details will be confirmed by operations.",
    createdAt: "2026-07-13T12:20:00Z",
  },
  {
    isDemo: true,
    id: "ap-002",
    reference: "YHP-A-0002",
    visitorName: "Sample Family Group",
    visitorEmail: "family@example.test",
    category: "private_ceremony",
    requestedDate: "2026-09-03",
    status: "requested",
    notes:
      "Private ceremony enquiry. Details will be published following operational confirmation.",
    createdAt: "2026-07-12T16:05:00Z",
  },
  {
    isDemo: true,
    id: "ap-003",
    reference: "YHP-A-0003",
    visitorName: "Sample Research Visitor",
    visitorEmail: "researcher@example.test",
    category: "media_research",
    requestedDate: "2026-08-21",
    status: "awaiting_visitor",
    assignedTo: "Sample Officer",
    createdAt: "2026-07-11T08:40:00Z",
  },
];
