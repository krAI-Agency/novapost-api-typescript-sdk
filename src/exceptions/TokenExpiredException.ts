import { ApiException } from "./ApiException.js";

export class TokenExpiredException extends ApiException {
  constructor(message: string, statusCode = 0, cause?: unknown) {
    super(message, statusCode, cause);
    this.name = "TokenExpiredException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
