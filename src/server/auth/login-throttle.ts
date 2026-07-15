import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";

import type { LoginAttemptsRepository } from "../repositories";
import type { AuthConfig, RequestContext } from "./auth-types";

export function hashLoginIdentifier(value: string | null | undefined): string {
  return createHash("sha256")
    .update((value ?? "unknown").trim().toLowerCase(), "utf8")
    .digest("hex");
}

export function getRequestIpHash(context: RequestContext): string {
  return hashLoginIdentifier(context.ipAddress ?? "unknown");
}

export async function isLoginRateLimited(input: {
  readonly attemptsRepository: LoginAttemptsRepository;
  readonly config: AuthConfig;
  readonly emailHash: string;
  readonly ipHash: string;
  readonly now: Date;
}): Promise<boolean> {
  const since = new Date(input.now.getTime() - input.config.loginWindowMinutes * 60_000);
  const counts = await input.attemptsRepository.countRecentFailures({
    emailHash: input.emailHash,
    ipHash: input.ipHash,
    since,
  });
  return (
    counts.emailFailures >= input.config.maxLoginAttempts ||
    counts.ipFailures >= input.config.maxLoginAttempts
  );
}
