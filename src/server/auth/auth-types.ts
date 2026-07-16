import type { AccountStatus } from "../repositories";

export type AuthMode = "disabled" | "database";

export interface AuthConfig {
  readonly mode: AuthMode;
  readonly sessionCookieName: string;
  readonly sessionIdleMinutes: number;
  readonly sessionAbsoluteHours: number;
  readonly loginWindowMinutes: number;
  readonly maxLoginAttempts: number;
  readonly accountLockMinutes: number;
  readonly passwordMinLength: number;
  readonly trustProxy: boolean;
  readonly nodeEnv: string;
}

export interface AuthenticationRecord {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly passwordHash: string | null;
  readonly accountStatus: AccountStatus;
  readonly failedLoginCount: number;
  readonly lockedUntil: Date | null;
  readonly archivedAt: Date | null;
}

export interface AuthenticatedPrincipal {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly accountStatus: AccountStatus;
  readonly roleCodes: string[];
  readonly roleLabels: string[];
  readonly permissionCodes: string[];
  readonly sessionId: string;
  readonly sessionExpiresAt: Date;
  readonly csrfToken?: string;
}

export interface RequestContext {
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly origin?: string | null;
  readonly host?: string | null;
  readonly protocol?: string | null;
  readonly forwardedProto?: string | null;
}

export type LoginFailureReason =
  | "invalid_credentials"
  | "account_locked"
  | "account_disabled"
  | "rate_limited";

export type LoginResult =
  | {
      readonly ok: true;
      readonly principal: AuthenticatedPrincipal;
      readonly csrfToken: string;
      readonly cookieHeader: string;
      readonly returnTo: string;
    }
  | {
      readonly ok: false;
      readonly reason: LoginFailureReason;
      readonly message: string;
    };

export type LogoutResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };
