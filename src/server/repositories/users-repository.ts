import type { UserRecord } from "./repository-types";
import type { AuthenticationRecord } from "../auth/auth-types";

export interface FailedLoginStateInput {
  readonly userId: string;
  readonly failedLoginCount: number;
  readonly lockedUntil?: Date | null;
}

export interface UsersRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findSafeUserById(id: string): Promise<UserRecord | null>;
  findAuthenticationRecordByEmail(email: string): Promise<AuthenticationRecord | null>;
  updateFailedLoginState(input: FailedLoginStateInput): Promise<void>;
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
}
