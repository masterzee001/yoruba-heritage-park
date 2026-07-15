export class AuthError extends Error {
  constructor(message = "Authentication failed.") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const genericLoginFailure = "The email address or password could not be verified.";
