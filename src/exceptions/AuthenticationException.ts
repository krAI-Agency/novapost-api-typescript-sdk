import { ApiException } from "./ApiException.js";

export class AuthenticationException extends ApiException {
  constructor(message: string, statusCode = 0, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "AuthenticationException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
