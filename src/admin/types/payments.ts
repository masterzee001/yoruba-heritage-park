import type { DemoRecord } from "./admin";

export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "abandoned"
  | "reversed"
  | "refund_pending"
  | "refunded";

export interface AdminPayment extends DemoRecord {
  id: string;
  reference: string;
  bookingReference: string;
  visitorName: string;
  amountNgn: number;
  currency: "NGN";
  provider: string;
  status: PaymentStatus;
  verificationStatus: "unverified" | "review_required" | "preview_verified" | "not_applicable";
  createdAt: string;
  refundStatus: "none" | "review_requested" | "preview_pending" | "preview_refunded";
  transactionReferencePlaceholder: string;
  relatedBookingType: string;
  activity: Array<{
    id: string;
    time: string;
    title: string;
    detail?: string;
  }>;
}

export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus | "all";
  verificationStatus?: AdminPayment["verificationStatus"] | "all";
  provider?: AdminPayment["provider"] | "all";
  date?: string;
}
