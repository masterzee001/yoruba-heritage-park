import "@tanstack/react-start/server-only";

import { getServerEnv } from "../env/server-env";
import type { AuthConfig } from "./auth-types";

export function getAuthConfig(): AuthConfig {
  const env = getServerEnv();
  return {
    ...env.auth,
    nodeEnv: env.nodeEnv,
  };
}

export function isDatabaseAuthEnabled(config = getAuthConfig()): boolean {
  return config.mode === "database";
}
