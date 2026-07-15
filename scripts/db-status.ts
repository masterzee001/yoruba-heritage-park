import { closeDatabasePool } from "../src/server/db";
import { getMigrationStatus } from "../src/server/db/migrations";

try {
  const status = await getMigrationStatus();
  if (status.changed.length > 0) {
    console.error(`Changed applied migration detected: ${status.changed[0].name}`);
    process.exitCode = 1;
  } else {
    console.log(`Applied migrations: ${status.applied.length}`);
    console.log(`Pending migrations: ${status.pending.length}`);
    for (const migration of status.pending) {
      console.log(`pending ${migration.name}`);
    }
  }
} catch {
  console.error("Migration status check failed.");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
