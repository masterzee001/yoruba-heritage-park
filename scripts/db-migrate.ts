import { closeDatabasePool } from "../src/server/db";
import { applyPendingMigrations } from "../src/server/db/migrations";

try {
  const status = await applyPendingMigrations();
  console.log(
    `Migration run complete. Applied: ${status.applied.length}; pending: ${status.pending.length}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration run failed.");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
