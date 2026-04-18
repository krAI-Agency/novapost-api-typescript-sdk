export class ApiException extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 0, cause?: unknown) {
    super(message, { cause: cause instanceof Error ? cause : undefined });
    this.name = "ApiException";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
