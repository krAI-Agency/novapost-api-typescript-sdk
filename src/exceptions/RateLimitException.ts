import { ApiException } from "./ApiException.js";

export class RateLimitException extends ApiException {
  constructor(message: string, statusCode = 0, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "RateLimitException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
