import { checkDatabaseHealth, closeDatabasePool } from "../src/server/db";

try {
  const result = await checkDatabaseHealth();
  if (!result.ok) {
    console.error(`Database check failed: ${result.code} ${result.message}`);
    process.exitCode = 1;
  } else {
    console.log(`Database check passed using ${result.driver}; charset=${result.charset}.`);
  }
} finally {
  await closeDatabasePool();
}
