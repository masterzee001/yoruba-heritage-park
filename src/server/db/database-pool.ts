import mysql, { type Pool } from "mysql2/promise";

import { getDatabaseConfig, toMysqlPoolOptions } from "./database-config";

let pool: Pool | undefined;

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = mysql.createPool(toMysqlPoolOptions(getDatabaseConfig()));
  }

  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (!pool) return;
  const existingPool = pool;
  pool = undefined;
  await existingPool.end();
}
