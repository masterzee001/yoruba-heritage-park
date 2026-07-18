import { z } from "zod";

export type AdminDataSource = "mock" | "mysql";
export type AuthMode = "disabled" | "database";
export type DatabaseSslMode = "disabled" | "preferred" | "required";
export type EmailDeliveryMode = "disabled" | "smtp";
export type PayPalEnvironment = "sandbox" | "live";

export interface ServerEnv {
  readonly nodeEnv: string;
  readonly adminDataSource: AdminDataSource;
  readonly auth: {
    readonly mode: AuthMode;
    readonly sessionCookieName: string;
    readonly sessionIdleMinutes: number;
    readonly sessionAbsoluteHours: number;
    readonly loginWindowMinutes: number;
    readonly maxLoginAttempts: number;
    readonly accountLockMinutes: number;
    readonly passwordMinLength: number;
    readonly trustProxy: boolean;
  };
  readonly database: {
    readonly host?: string;
    readonly port: number;
    readonly name?: string;
    readonly user?: string;
    readonly password?: string;
    readonly connectionLimit: number;
    readonly sslMode: DatabaseSslMode;
  };
  readonly payments: {
    readonly checkoutEnabled: boolean;
    readonly allowLiveCapture: boolean;
    readonly paypal: {
      readonly environment: PayPalEnvironment;
      readonly clientId?: string;
      readonly secretKey?: string;
      readonly webhookId?: string;
    };
  };
  readonly email: {
    readonly deliveryMode: EmailDeliveryMode;
    readonly fromAddress?: string;
    readonly adminAddress?: string;
    readonly fromName?: string;
    readonly publicBaseUrl?: string;
    readonly smtp: {
      readonly host?: string;
      readonly port: number;
      readonly secure: boolean;
      readonly user?: string;
      readonly password?: string;
    };
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
const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return emptyToUndefined(value);

    const normalized = value.trim().toLowerCase();
    if (normalized === "") return undefined;
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;

    return value;
  }, z.boolean().default(defaultValue));
const urlText = z.preprocess(emptyToUndefined, z.string().trim().url().optional());
const cookieNameSchema = z
  .preprocess(emptyToUndefined, z.string().trim().min(1).max(64).default("yhp_admin"))
  .refine((value) => /^[A-Za-z0-9_-]+$/.test(value), "Cookie name is invalid.");

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
  AUTH_MODE: z
    .preprocess(emptyToUndefined, z.enum(["disabled", "database"]).default("disabled"))
    .default("disabled"),
  AUTH_SESSION_COOKIE_NAME: cookieNameSchema,
  AUTH_SESSION_IDLE_MINUTES: integerFromEnv(30, 5, 240),
  AUTH_SESSION_ABSOLUTE_HOURS: integerFromEnv(8, 1, 72),
  AUTH_LOGIN_WINDOW_MINUTES: integerFromEnv(15, 1, 120),
  AUTH_MAX_LOGIN_ATTEMPTS: integerFromEnv(5, 3, 20),
  AUTH_ACCOUNT_LOCK_MINUTES: integerFromEnv(15, 1, 1440),
  AUTH_PASSWORD_MIN_LENGTH: integerFromEnv(15, 12, 128),
  AUTH_TRUST_PROXY: booleanFromEnv(true),
  PAYMENT_CHECKOUT_ENABLED: booleanFromEnv(false),
  PAYMENT_ALLOW_LIVE_CAPTURE: booleanFromEnv(false),
  PAYPAL_ENVIRONMENT: z
    .preprocess(emptyToUndefined, z.enum(["sandbox", "live"]).default("sandbox"))
    .default("sandbox"),
  PAYPAL_CLIENT_ID: optionalText,
  PAYPAL_SECRET_KEY: optionalText,
  PAYPAL_WEBHOOK_ID: optionalText,
  EMAIL_DELIVERY_MODE: z
    .preprocess(emptyToUndefined, z.enum(["disabled", "smtp"]).default("disabled"))
    .default("disabled"),
  EMAIL_FROM_ADDRESS: z.preprocess(emptyToUndefined, z.string().trim().email().optional()),
  EMAIL_ADMIN_ADDRESS: z.preprocess(emptyToUndefined, z.string().trim().email().optional()),
  EMAIL_FROM_NAME: optionalText,
  EMAIL_PUBLIC_BASE_URL: urlText,
  SMTP_HOST: optionalText,
  SMTP_PORT: integerFromEnv(587, 1, 65535),
  SMTP_SECURE: booleanFromEnv(false),
  SMTP_USER: optionalText,
  SMTP_PASSWORD: optionalText,
});

const requiredDatabaseVariables = [
  "DATABASE_HOST",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
] as const;

const requiredSmtpVariables = [
  "EMAIL_FROM_ADDRESS",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
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
  const mysqlRequired =
    options.requireDatabase === true ||
    env.ADMIN_DATA_SOURCE === "mysql" ||
    env.AUTH_MODE === "database";
  const missingVariables = mysqlRequired
    ? requiredDatabaseVariables.filter((name) => !env[name])
    : [];
  const missingSmtpVariables =
    env.EMAIL_DELIVERY_MODE === "smtp" ? requiredSmtpVariables.filter((name) => !env[name]) : [];

  if (missingVariables.length > 0 || missingSmtpVariables.length > 0) {
    throw new ServerEnvError("Required server environment variables are missing.", {
      missingVariables: [...missingVariables, ...missingSmtpVariables],
    });
  }

  return {
    nodeEnv: env.NODE_ENV,
    adminDataSource: env.ADMIN_DATA_SOURCE,
    auth: {
      mode: env.AUTH_MODE,
      sessionCookieName: env.AUTH_SESSION_COOKIE_NAME,
      sessionIdleMinutes: env.AUTH_SESSION_IDLE_MINUTES,
      sessionAbsoluteHours: env.AUTH_SESSION_ABSOLUTE_HOURS,
      loginWindowMinutes: env.AUTH_LOGIN_WINDOW_MINUTES,
      maxLoginAttempts: env.AUTH_MAX_LOGIN_ATTEMPTS,
      accountLockMinutes: env.AUTH_ACCOUNT_LOCK_MINUTES,
      passwordMinLength: env.AUTH_PASSWORD_MIN_LENGTH,
      trustProxy: env.AUTH_TRUST_PROXY,
    },
    database: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      name: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      connectionLimit: env.DATABASE_CONNECTION_LIMIT,
      sslMode: env.DATABASE_SSL_MODE,
    },
    payments: {
      checkoutEnabled: env.PAYMENT_CHECKOUT_ENABLED,
      allowLiveCapture: env.PAYMENT_ALLOW_LIVE_CAPTURE,
      paypal: {
        environment: env.PAYPAL_ENVIRONMENT,
        clientId: env.PAYPAL_CLIENT_ID,
        secretKey: env.PAYPAL_SECRET_KEY,
        webhookId: env.PAYPAL_WEBHOOK_ID,
      },
    },
    email: {
      deliveryMode: env.EMAIL_DELIVERY_MODE,
      fromAddress: env.EMAIL_FROM_ADDRESS,
      adminAddress: env.EMAIL_ADMIN_ADDRESS,
      fromName: env.EMAIL_FROM_NAME,
      publicBaseUrl: env.EMAIL_PUBLIC_BASE_URL,
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
      },
    },
  };
}

export function validateServerEnv(options: ServerEnvOptions = {}): { ok: true } {
  getServerEnv(options);
  return { ok: true };
}

function assertNoViteDatabaseVariables(source: NodeJS.ProcessEnv): void {
  const invalidVariables = Object.keys(source).filter(
    (key) =>
      key.startsWith("VITE_") &&
      (key.includes("DATABASE") ||
        key.includes("AUTH") ||
        key.includes("PAYMENT") ||
        key.includes("PAYPAL") ||
        key.includes("PAYSTACK") ||
        key.includes("STRIPE") ||
        key.includes("EMAIL") ||
        key.includes("SMTP")),
  );

  if (invalidVariables.length > 0) {
    throw new ServerEnvError("Server-only variables must not use the VITE_ prefix.", {
      invalidVariables,
    });
  }
}
