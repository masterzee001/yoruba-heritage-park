import type { AuthenticatedPrincipal } from "../auth/auth-types";

export interface CreateSessionInput {
  readonly userId: string;
  readonly tokenHash: string;
  readonly csrfTokenHash: string;
  readonly createdAt: Date;
  readonly lastSeenAt: Date;
  readonly idleExpiresAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly ipHash?: string | null;
  readonly userAgentHash?: string | null;
}

export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly csrfTokenHash: string;
  readonly createdAt: Date;
  readonly lastSeenAt: Date;
  readonly idleExpiresAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly revokedAt: Date | null;
  readonly revokedReason: string | null;
}

export interface SessionAuthenticationRecord extends SessionRecord {
  readonly principal: Omit<AuthenticatedPrincipal, "sessionId" | "sessionExpiresAt" | "csrfToken">;
}

export interface SessionsRepository {
  create(input: CreateSessionInput): Promise<SessionRecord>;
  findActiveByTokenHash(tokenHash: string, now?: Date): Promise<SessionAuthenticationRecord | null>;
  updateLastSeen(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void>;
  revokeByTokenHash(tokenHash: string, reason: string): Promise<boolean>;
  revokeBySessionId(sessionId: string, reason: string): Promise<boolean>;
  revokeAllForUser(userId: string, reason: string): Promise<number>;
}
