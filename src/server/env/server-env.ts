import { z } from "zod";

export type AdminDataSource = "mock" | "mysql";
export type DatabaseSslMode = "disabled" | "preferred" | "required";

export interface ServerEnv {
  readonly nodeEnv: string;
  readonly adminDataSource: AdminDataSource;
  readonly database: {
    readonly host?: string;
    readonly port: number;
    readonly name?: string;
    readonly user?: string;
    readonly password?: string;
    readonly connectionLimit: number;
    readonly sslMode: DatabaseSslMode;
  };
}

export interface ServerEnvOptions {
  readonly requireDatabase?: boolean;
  readonly source?: NodeJS.ProcessEnv;
}

export class ServerEnvError extends Error {
  readonly missingVariables: string[];
  readonly invalidVariables: string[];

  constructor(
    message: string,
    details: { missingVariables?: string[]; invalidVariables?: string[] },
  ) {
    super(message);
    this.name = "ServerEnvError";
    this.missingVariables = details.missingVariables ?? [];
    this.invalidVariables = details.invalidVariables ?? [];
  }
}

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());
const integerFromEnv = (defaultValue: number, minimum: number, maximum: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(minimum).max(maximum).default(defaultValue),
  );

const baseEnvSchema = z.object({
  NODE_ENV: z.preprocess(emptyToUndefined, z.string().trim().min(1).default("development")),
  ADMIN_DATA_SOURCE: z
    .preprocess(emptyToUndefined, z.enum(["mock", "mysql"]).default("mock"))
    .default("mock"),
  DATABASE_HOST: optionalText,
  DATABASE_PORT: integerFromEnv(3306, 1, 65535),
  DATABASE_NAME: optionalText,
  DATABASE_USER: optionalText,
  DATABASE_PASSWORD: optionalText,
  DATABASE_CONNECTION_LIMIT: integerFromEnv(5, 1, 10),
  DATABASE_SSL_MODE: z
    .preprocess(emptyToUndefined, z.enum(["disabled", "preferred", "required"]).default("disabled"))
    .default("disabled"),
});

const requiredDatabaseVariables = [
  "DATABASE_HOST",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
] as const;

export function getServerEnv(options: ServerEnvOptions = {}): ServerEnv {
  const source = options.source ?? process.env;
  assertNoViteDatabaseVariables(source);

  const parsed = baseEnvSchema.safeParse(source);
  if (!parsed.success) {
    const invalidVariables = parsed.error.issues.map((issue) => String(issue.path[0]));
    throw new ServerEnvError("Server environment validation failed.", {
      invalidVariables: Array.from(new Set(invalidVariables)),
    });
  }

  const env = parsed.data;
  const mysqlRequired = options.requireDatabase === true || env.ADMIN_DATA_SOURCE === "mysql";
  const missingVariables = mysqlRequired
    ? requiredDatabaseVariables.filter((name) => !env[name])
    : [];

  if (missingVariables.length > 0) {
    throw new ServerEnvError("Database environment variables are required for MySQL mode.", {
      missingVariables,
    });
  }

  return {
    nodeEnv: env.NODE_ENV,
    adminDataSource: env.ADMIN_DATA_SOURCE,
    database: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      name: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      connectionLimit: env.DATABASE_CONNECTION_LIMIT,
      sslMode: env.DATABASE_SSL_MODE,
    },
  };
}

export function validateServerEnv(options: ServerEnvOptions = {}): { ok: true } {
  getServerEnv(options);
  return { ok: true };
}

function assertNoViteDatabaseVariables(source: NodeJS.ProcessEnv): void {
  const invalidVariables = Object.keys(source).filter(
    (key) => key.startsWith("VITE_") && key.includes("DATABASE"),
  );

  if (invalidVariables.length > 0) {
    throw new ServerEnvError("Database variables must not use the VITE_ prefix.", {
      invalidVariables,
    });
  }
}
