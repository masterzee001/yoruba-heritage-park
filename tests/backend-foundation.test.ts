import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import { normaliseDatabaseError } from "../src/server/db/database-errors";
import {
  calculateChecksum,
  detectChangedMigrations,
  discoverMigrationFiles,
  findDuplicateMigrationPrefixes,
} from "../src/server/db/migrations";
import { getServerEnv, ServerEnvError } from "../src/server/env/server-env";
import {
  normaliseEmail,
  requireCode,
  requireId,
} from "../src/server/repositories/mysql/mysql-helpers";

describe("server environment validation", () => {
  test("uses safe mock defaults without database credentials", () => {
    const env = getServerEnv({ source: {} });

    expect(env.adminDataSource).toBe("mock");
    expect(env.database.port).toBe(3306);
    expect(env.database.connectionLimit).toBe(5);
    expect(env.database.sslMode).toBe("disabled");
    expect(env.payments.checkoutEnabled).toBe(false);
    expect(env.payments.allowLiveCapture).toBe(false);
    expect(env.payments.paypal.environment).toBe("sandbox");
    expect(env.email.deliveryMode).toBe("disabled");
  });

  test("requires database variables when mysql mode is selected", () => {
    expect(() => getServerEnv({ source: { ADMIN_DATA_SOURCE: "mysql" } })).toThrow(ServerEnvError);

    try {
      getServerEnv({ source: { ADMIN_DATA_SOURCE: "mysql" } });
    } catch (error) {
      expect(error).toBeInstanceOf(ServerEnvError);
      expect((error as ServerEnvError).missingVariables).toEqual([
        "DATABASE_HOST",
        "DATABASE_NAME",
        "DATABASE_USER",
        "DATABASE_PASSWORD",
      ]);
    }
  });

  test("treats empty database strings as missing", () => {
    expect(() =>
      getServerEnv({
        requireDatabase: true,
        source: {
          DATABASE_HOST: " ",
          DATABASE_NAME: "",
          DATABASE_USER: "demo_user",
          DATABASE_PASSWORD: " ",
        },
      }),
    ).toThrow(ServerEnvError);
  });

  test("validates integer limits conservatively", () => {
    expect(() =>
      getServerEnv({
        source: {
          DATABASE_CONNECTION_LIMIT: "50",
        },
      }),
    ).toThrow(ServerEnvError);
  });

  test("rejects VITE-prefixed database variables", () => {
    expect(() => getServerEnv({ source: { VITE_DATABASE_PASSWORD: "secret" } })).toThrow(
      ServerEnvError,
    );
  });

  test("validates server-only payment launch flags", () => {
    const env = getServerEnv({
      source: {
        PAYMENT_CHECKOUT_ENABLED: "true",
        PAYMENT_ALLOW_LIVE_CAPTURE: "true",
        PAYPAL_ENVIRONMENT: "live",
      },
    });

    expect(env.payments.checkoutEnabled).toBe(true);
    expect(env.payments.allowLiveCapture).toBe(true);
    expect(env.payments.paypal.environment).toBe("live");
    expect(() => getServerEnv({ source: { VITE_PAYPAL_SECRET_KEY: "secret" } })).toThrow(
      ServerEnvError,
    );
    expect(() => getServerEnv({ source: { VITE_PAYSTACK_SECRET_KEY: "secret" } })).toThrow(
      ServerEnvError,
    );
    expect(() => getServerEnv({ source: { VITE_STRIPE_SECRET_KEY: "secret" } })).toThrow(
      ServerEnvError,
    );
  });

  test("validates server-only email configuration", () => {
    const env = getServerEnv({
      source: {
        EMAIL_DELIVERY_MODE: "smtp",
        EMAIL_FROM_ADDRESS: "admin@example.test",
        EMAIL_FROM_NAME: "Yoruba Heritage Park",
        EMAIL_PUBLIC_BASE_URL: "https://preview.example.test",
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
        SMTP_USER: "smtp-user",
        SMTP_PASSWORD: "smtp-password",
      },
    });

    expect(env.email.deliveryMode).toBe("smtp");
    expect(env.email.fromAddress).toBe("admin@example.test");
    expect(env.email.publicBaseUrl).toBe("https://preview.example.test");
    expect(env.email.smtp.secure).toBe(true);
    expect(() => getServerEnv({ source: { EMAIL_DELIVERY_MODE: "smtp" } })).toThrow(ServerEnvError);
    expect(() => getServerEnv({ source: { VITE_SMTP_PASSWORD: "secret" } })).toThrow(
      ServerEnvError,
    );
    expect(() =>
      getServerEnv({ source: { VITE_EMAIL_FROM_ADDRESS: "admin@example.test" } }),
    ).toThrow(ServerEnvError);
  });
});

describe("migration integrity", () => {
  test("discovers migrations in deterministic order", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "yhp-migrations-"));
    try {
      writeFileSync(path.join(directory, "002_second.sql"), "SELECT 2;", "utf8");
      writeFileSync(path.join(directory, "001_first.sql"), "SELECT 1;", "utf8");

      const migrations = discoverMigrationFiles(directory);
      expect(migrations.map((migration) => migration.name)).toEqual([
        "001_first.sql",
        "002_second.sql",
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test("detects duplicate migration prefixes", () => {
    expect(findDuplicateMigrationPrefixes(["001_first.sql", "001_duplicate.sql"])).toEqual(["001"]);
  });

  test("generates stable checksums and detects changed applied migrations", () => {
    const checksum = calculateChecksum("SELECT 1;");
    expect(checksum).toHaveLength(64);
    expect(calculateChecksum("SELECT 1;")).toBe(checksum);

    const changed = detectChangedMigrations(
      [
        {
          name: "001_first.sql",
          path: "/tmp/001_first.sql",
          sql: "SELECT 2;",
          checksum: calculateChecksum("SELECT 2;"),
        },
      ],
      [
        {
          migrationName: "001_first.sql",
          checksum,
          appliedAt: new Date("2026-01-01T00:00:00.000Z"),
          executionTimeMs: 1,
        },
      ],
    );

    expect(changed).toHaveLength(1);
    expect(changed[0].name).toBe("001_first.sql");
  });
});

describe("database error sanitisation", () => {
  test("does not expose secret values in sanitised errors", () => {
    const error = {
      code: "ER_ACCESS_DENIED_ERROR",
      message: "Access denied for user demo_user using password secret-value at db.internal",
    };

    const sanitised = normaliseDatabaseError(error);
    expect(sanitised.code).toBe("ER_ACCESS_DENIED_ERROR");
    expect(sanitised.message).toBe("Database access was denied.");
    expect(sanitised.message).not.toContain("secret-value");
    expect(sanitised.message).not.toContain("demo_user");
    expect(sanitised.message).not.toContain("db.internal");
  });
});

describe("repository input validation", () => {
  test("normalises email and rejects invalid identifiers", () => {
    expect(normaliseEmail(" Admin@Example.COM ")).toBe("admin@example.com");
    expect(() => normaliseEmail("not-an-email")).toThrow();
    expect(() => requireId("")).toThrow();
    expect(() => requireCode("")).toThrow();
  });
});
