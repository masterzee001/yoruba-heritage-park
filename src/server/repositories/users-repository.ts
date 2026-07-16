import type { UserRecord } from "./repository-types";
import type { AuthenticationRecord } from "../auth/auth-types";
import type { AccountStatus } from "./repository-types";

export interface FailedLoginStateInput {
  readonly userId: string;
  readonly failedLoginCount: number;
  readonly lockedUntil?: Date | null;
}

export interface CreateUserInput {
  readonly email: string;
  readonly displayName: string;
  readonly accountStatus?: AccountStatus;
}

export interface UpdateUserInput {
  readonly userId: string;
  readonly displayName?: string;
  readonly accountStatus?: AccountStatus;
}

export interface UsersRepository {
  list(limit?: number): Promise<UserRecord[]>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findSafeUserById(id: string): Promise<UserRecord | null>;
  findAuthenticationRecordByEmail(email: string): Promise<AuthenticationRecord | null>;
  updateFailedLoginState(input: FailedLoginStateInput): Promise<void>;
  create(input: CreateUserInput): Promise<UserRecord>;
  update(input: UpdateUserInput): Promise<UserRecord | null>;
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
}
