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
  provider: "pending_configuration";
  status: PaymentStatus;
  verificationStatus: "unverified" | "verified" | "not_applicable";
  createdAt: string;
  refundStatus: "none" | "requested" | "processed";
}
