import type { AdminPayment } from "../types";

export const mockPayments: AdminPayment[] = [
  {
    isDemo: true,
    id: "p-001",
    reference: "YHP-P-0001",
    bookingReference: "YHP-B-0001",
    visitorName: "Sample Visitor A",
    amountNgn: 0,
    currency: "NGN",
    provider: "pending_configuration",
    status: "pending",
    verificationStatus: "not_applicable",
    createdAt: "2026-07-10T09:24:00Z",
    refundStatus: "none",
    transactionReferencePlaceholder: "PREVIEW-TRANSACTION-NOT-CONNECTED",
    relatedBookingType: "Cultural Tour",
    activity: [
      {
        id: "pa-001",
        time: "2026-07-10T09:24:00Z",
        title: "Preview payment record created",
        detail: "Payment processing is not enabled in preview mode.",
      },
    ],
  },
  {
    isDemo: true,
    id: "p-002",
    reference: "YHP-P-0002",
    bookingReference: "YHP-B-0003",
    visitorName: "Sample School Group",
    amountNgn: 0,
    currency: "NGN",
    provider: "pending_configuration",
    status: "pending",
    verificationStatus: "not_applicable",
    createdAt: "2026-07-12T08:11:00Z",
    refundStatus: "none",
    transactionReferencePlaceholder: "PREVIEW-TRANSACTION-NOT-CONNECTED",
    relatedBookingType: "School Group",
    activity: [
      {
        id: "pa-002",
        time: "2026-07-12T08:11:00Z",
        title: "Preview payment record created",
        detail: "Awaiting authorised payment configuration.",
      },
    ],
  },
];
