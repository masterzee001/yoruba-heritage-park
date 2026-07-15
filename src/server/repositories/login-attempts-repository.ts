export type LoginAttemptOutcome =
  | "success"
  | "invalid_credentials"
  | "account_locked"
  | "account_disabled"
  | "rate_limited";

export interface CreateLoginAttemptInput {
  readonly emailHash: string;
  readonly ipHash: string;
  readonly outcome: LoginAttemptOutcome;
  readonly attemptedAt: Date;
  readonly userId?: string | null;
  readonly metadataJson?: unknown;
}

export interface LoginAttemptsRepository {
  record(input: CreateLoginAttemptInput): Promise<void>;
  countRecentFailures(input: {
    readonly emailHash: string;
    readonly ipHash: string;
    readonly since: Date;
  }): Promise<{ emailFailures: number; ipFailures: number }>;
}
