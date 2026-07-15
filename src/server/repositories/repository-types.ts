export type AccountStatus = "invited" | "active" | "suspended" | "disabled" | "archived";
export type AuditOutcome = "success" | "denied" | "failed" | "informational";
export type EventStatus = "draft" | "published" | "cancelled" | "appointment_only";
export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "refund_requested"
  | "refunded";
export type BookingSource = "website" | "phone" | "walk_in" | "partner";
export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "abandoned"
  | "reversed"
  | "refund_pending"
  | "refunded";

export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly accountStatus: AccountStatus;
  readonly emailVerifiedAt: Date | null;
  readonly lastLoginAt: Date | null;
  readonly failedLoginCount: number;
  readonly lockedUntil: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly archivedAt: Date | null;
}

export interface RoleRecord {
  readonly id: string;
  readonly roleCode: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly isSystemRole: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PermissionRecord {
  readonly id: string;
  readonly permissionCode: string;
  readonly moduleCode: string;
  readonly actionCode: string;
  readonly description: string | null;
  readonly createdAt: Date;
}

export interface AppSettingRecord {
  readonly id: string;
  readonly settingGroup: string;
  readonly settingKey: string;
  readonly valueJson: unknown;
  readonly isPublic: boolean;
  readonly updatedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AuditLogRecord {
  readonly id: string;
  readonly actorUserId: string | null;
  readonly actionCode: string;
  readonly moduleCode: string;
  readonly recordType: string | null;
  readonly recordId: string | null;
  readonly outcome: AuditOutcome;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadataJson: unknown;
  readonly createdAt: Date;
}

export interface CreateAuditLogInput {
  readonly actorUserId?: string | null;
  readonly actionCode: string;
  readonly moduleCode: string;
  readonly recordType?: string | null;
  readonly recordId?: string | null;
  readonly outcome: AuditOutcome;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly metadataJson?: unknown;
}

export interface EventRecord {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly category: string;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly capacity: number | null;
  readonly bookedCount: number;
  readonly status: EventStatus;
  readonly featured: boolean;
  readonly repeating: boolean;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface EventListFilters {
  readonly search?: string;
  readonly status?: EventStatus | "all";
  readonly category?: string;
  readonly includeDeleted?: boolean;
  readonly limit?: number;
}

export interface BookingRecord {
  readonly id: string;
  readonly reference: string;
  readonly visitorName: string;
  readonly visitorEmail: string;
  readonly countryOfOrigin: string | null;
  readonly bookingType: string;
  readonly visitDate: Date;
  readonly durationOfStayDays: number | null;
  readonly guests: number;
  readonly amountMinor: number;
  readonly currency: string;
  readonly paymentState: "unpaid" | "pending" | "paid" | "refunded" | "not_applicable";
  readonly status: BookingStatus;
  readonly checkedInAt: Date | null;
  readonly source: BookingSource;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface CreateBookingInput {
  readonly visitorName: string;
  readonly visitorEmail: string;
  readonly countryOfOrigin?: string | null;
  readonly bookingType: string;
  readonly visitDate: string;
  readonly durationOfStayDays?: number | null;
  readonly guests: number;
  readonly amountMinor?: number;
  readonly currency?: string;
  readonly paymentState?: BookingRecord["paymentState"];
  readonly status?: BookingStatus;
  readonly source?: BookingSource;
  readonly notes?: string | null;
}

export interface PaymentProviderSettingsRecord {
  readonly id: string;
  readonly providerCode: string;
  readonly displayName: string;
  readonly mode: "test" | "live";
  readonly enabled: boolean;
  readonly publicKey: string | null;
  readonly secretReference: string | null;
  readonly currency: string;
  readonly minimumAmountMinor: number;
  readonly configurationJson: unknown;
  readonly updatedByUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PaymentRecord {
  readonly id: string;
  readonly reference: string;
  readonly bookingId: string | null;
  readonly campaignId: string | null;
  readonly payerName: string;
  readonly payerEmail: string | null;
  readonly amountMinor: number;
  readonly currency: string;
  readonly providerCode: string;
  readonly providerTransactionReference: string | null;
  readonly status: PaymentStatus;
  readonly verificationStatus:
    | "unverified"
    | "review_required"
    | "preview_verified"
    | "not_applicable";
  readonly refundStatus: "none" | "review_requested" | "preview_pending" | "preview_refunded";
  readonly metadataJson: unknown;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
