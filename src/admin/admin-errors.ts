export function getAdminErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.name === "AuthError") return "Your administrator session has expired. Sign in again.";
    if (error.name === "ForbiddenError") {
      return "Your administrator account does not have permission to use this section.";
    }

    const message = error.message.trim();
    if (message === "Authentication failed.") {
      return "Your administrator session has expired. Sign in again.";
    }
    if (message && message !== "Failed to fetch") return message;
  }

  return fallback;
}
