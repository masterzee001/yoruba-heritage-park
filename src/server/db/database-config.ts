import type { PoolOptions } from "mysql2/promise";

import { getServerEnv } from "../env/server-env";

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly connectionLimit: number;
  readonly sslMode: "disabled" | "preferred" | "required";
}

export function getDatabaseConfig(): DatabaseConfig {
  const env = getServerEnv({ requireDatabase: true });
  const database = env.database;

  return {
    host: database.host!,
    port: database.port,
    database: database.name!,
    user: database.user!,
    password: database.password!,
    connectionLimit: database.connectionLimit,
    sslMode: database.sslMode,
  };
}

export function toMysqlPoolOptions(config: DatabaseConfig): PoolOptions {
  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z",
    namedPlaceholders: true,
    ssl: sslOptions(config.sslMode),
  };
}

function sslOptions(mode: DatabaseConfig["sslMode"]): PoolOptions["ssl"] {
  if (mode === "disabled") return undefined;
  if (mode === "preferred") return { rejectUnauthorized: false };
  return { minVersion: "TLSv1.2" };
}
