import type { RowDataPacket } from "mysql2";

import { normaliseDatabaseError } from "./database-errors";
import { getDatabasePool } from "./database-pool";

export type DatabaseHealthResult =
  | {
      readonly ok: true;
      readonly driver: "mysql2";
      readonly databaseReachable: true;
      readonly charset: string;
    }
  | {
      readonly ok: false;
      readonly databaseReachable: false;
      readonly code: string;
      readonly message: string;
    };

interface CharsetRow extends RowDataPacket {
  charset: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  let connection;

  try {
    const pool = getDatabasePool();
    connection = await pool.getConnection();
    await connection.query("SELECT 1");
    const [rows] = await connection.query<CharsetRow[]>(
      "SELECT @@character_set_connection AS charset",
    );

    return {
      ok: true,
      driver: "mysql2",
      databaseReachable: true,
      charset: rows[0]?.charset ?? "unknown",
    };
  } catch (error) {
    const sanitised = normaliseDatabaseError(error);
    return {
      ok: false,
      databaseReachable: false,
      code: sanitised.code,
      message: sanitised.message,
    };
  } finally {
    connection?.release();
  }
}
