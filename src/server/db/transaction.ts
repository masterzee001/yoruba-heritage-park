import type { PoolConnection } from "mysql2/promise";

import { toDatabaseError } from "./database-errors";
import { getDatabasePool } from "./database-pool";

export async function withTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getDatabasePool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Preserve the original failure; rollback errors are intentionally not exposed.
    }
    throw toDatabaseError(error);
  } finally {
    connection.release();
  }
}
