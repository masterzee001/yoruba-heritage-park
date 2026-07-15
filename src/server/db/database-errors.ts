export interface SanitisedDatabaseError {
  readonly code: string;
  readonly message: string;
}

const fallbackError: SanitisedDatabaseError = {
  code: "DATABASE_ERROR",
  message: "A database operation failed.",
};

export class DatabaseError extends Error {
  readonly code: string;

  constructor(error: SanitisedDatabaseError) {
    super(error.message);
    this.name = "DatabaseError";
    this.code = error.code;
  }
}

export function normaliseDatabaseError(error: unknown): SanitisedDatabaseError {
  if (error instanceof DatabaseError) {
    return { code: error.code, message: error.message };
  }

  if (error != null && typeof error === "object") {
    const candidate = error as { code?: unknown; errno?: unknown };
    const code =
      typeof candidate.code === "string"
        ? candidate.code
        : typeof candidate.errno === "number"
          ? `MYSQL_${candidate.errno}`
          : fallbackError.code;

    return {
      code: sanitiseCode(code),
      message: messageForCode(code),
    };
  }

  return fallbackError;
}

export function toDatabaseError(error: unknown): DatabaseError {
  return new DatabaseError(normaliseDatabaseError(error));
}

function sanitiseCode(code: string): string {
  return code.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
}

function messageForCode(code: string): string {
  switch (code) {
    case "ER_ACCESS_DENIED_ERROR":
      return "Database access was denied.";
    case "ER_BAD_DB_ERROR":
      return "The configured database could not be selected.";
    case "ECONNREFUSED":
    case "ENOTFOUND":
    case "ETIMEDOUT":
      return "The database could not be reached.";
    default:
      return fallbackError.message;
  }
}
