import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { normaliseDatabaseError, toDatabaseError } from "./database-errors";
import { getDatabasePool } from "./database-pool";

export interface MigrationFile {
  readonly name: string;
  readonly path: string;
  readonly sql: string;
  readonly checksum: string;
}

export interface AppliedMigration {
  readonly migrationName: string;
  readonly checksum: string;
  readonly appliedAt: Date;
  readonly executionTimeMs: number;
}

export interface MigrationStatus {
  readonly applied: AppliedMigration[];
  readonly pending: MigrationFile[];
  readonly changed: Array<{
    readonly name: string;
    readonly expected: string;
    readonly actual: string;
  }>;
}

interface MigrationRow extends RowDataPacket {
  migration_name: string;
  checksum: string;
  applied_at: Date;
  execution_time_ms: number;
}

const migrationNamePattern = /^\d{3,}_[a-z0-9_]+\.sql$/;

export function getMigrationsDirectory(): string {
  return path.resolve(process.cwd(), "database", "migrations");
}

export function calculateChecksum(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

export function discoverMigrationFiles(directory = getMigrationsDirectory()): MigrationFile[] {
  const names = readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const duplicatePrefixes = findDuplicateMigrationPrefixes(names);

  if (duplicatePrefixes.length > 0) {
    throw new Error(`Duplicate migration prefix detected: ${duplicatePrefixes[0]}`);
  }

  for (const name of names) {
    if (!migrationNamePattern.test(name)) {
      throw new Error(`Migration file name is not ordered and deterministic: ${name}`);
    }
  }

  return names.map((name) => {
    const filePath = path.join(directory, name);
    const sql = readFileSync(filePath, "utf8");
    return {
      name,
      path: filePath,
      sql,
      checksum: calculateChecksum(sql),
    };
  });
}

export function findDuplicateMigrationPrefixes(names: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of names) {
    const prefix = name.split("_")[0];
    if (seen.has(prefix)) {
      duplicates.add(prefix);
    }
    seen.add(prefix);
  }

  return Array.from(duplicates);
}

export function detectChangedMigrations(
  files: MigrationFile[],
  applied: AppliedMigration[],
): MigrationStatus["changed"] {
  return applied.flatMap((migration) => {
    const file = files.find((candidate) => candidate.name === migration.migrationName);
    if (!file || file.checksum === migration.checksum) return [];
    return [
      {
        name: migration.migrationName,
        expected: migration.checksum,
        actual: file.checksum,
      },
    ];
  });
}

export async function ensureMigrationTable(connection: PoolConnection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      migration_name VARCHAR(191) NOT NULL,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INT UNSIGNED NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_name (migration_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function getAppliedMigrations(
  connection: PoolConnection,
): Promise<AppliedMigration[]> {
  await ensureMigrationTable(connection);
  const [rows] = await connection.query<MigrationRow[]>(
    "SELECT migration_name, checksum, applied_at, execution_time_ms FROM schema_migrations ORDER BY migration_name ASC",
  );

  return rows.map((row) => ({
    migrationName: row.migration_name,
    checksum: row.checksum,
    appliedAt: row.applied_at,
    executionTimeMs: row.execution_time_ms,
  }));
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  const connection = await getDatabasePool().getConnection();

  try {
    const files = discoverMigrationFiles();
    const applied = await getAppliedMigrations(connection);
    const changed = detectChangedMigrations(files, applied);
    const appliedNames = new Set(applied.map((migration) => migration.migrationName));
    const pending = files.filter((file) => !appliedNames.has(file.name));
    return { applied, pending, changed };
  } catch (error) {
    throw toDatabaseError(error);
  } finally {
    connection.release();
  }
}

export async function applyPendingMigrations(): Promise<MigrationStatus> {
  const connection = await getDatabasePool().getConnection();

  try {
    const files = discoverMigrationFiles();
    const applied = await getAppliedMigrations(connection);
    const changed = detectChangedMigrations(files, applied);
    if (changed.length > 0) {
      throw new Error(`Applied migration checksum changed: ${changed[0].name}`);
    }

    const appliedNames = new Set(applied.map((migration) => migration.migrationName));
    const pending = files.filter((file) => !appliedNames.has(file.name));

    for (const migration of pending) {
      const startedAt = Date.now();
      await connection.beginTransaction();
      try {
        for (const statement of splitSqlStatements(migration.sql)) {
          await connection.query(statement);
        }
        await connection.query(
          "INSERT INTO schema_migrations (migration_name, checksum, execution_time_ms) VALUES (?, ?, ?)",
          [migration.name, migration.checksum, Date.now() - startedAt],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    return getMigrationStatus();
  } catch (error) {
    const sanitised = normaliseDatabaseError(error);
    throw new Error(`${sanitised.code}: ${sanitised.message}`);
  } finally {
    connection.release();
  }
}

export function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !statement.startsWith("--"));
}
