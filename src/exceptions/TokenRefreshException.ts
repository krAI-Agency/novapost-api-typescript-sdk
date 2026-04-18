import { ApiException } from "./ApiException.js";

export class TokenRefreshException extends ApiException {
  constructor(message: string, statusCode = 0, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "TokenRefreshException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
