import { ApiException } from "../exceptions/ApiException.js";
import { AuthenticationException } from "../exceptions/AuthenticationException.js";
import { RateLimitException } from "../exceptions/RateLimitException.js";
import { TokenExpiredException } from "../exceptions/TokenExpiredException.js";
import type { ResponseValidatorInterface } from "./ResponseValidatorInterface.js";

export class HttpResponseValidator implements ResponseValidatorInterface {
  validate(response: Response): void {
    const statusCode = response.status;

    if (statusCode < 400 || statusCode === 422) {
      return;
    }

    if (statusCode === 401) {
      this.handleUnauthorized(statusCode);
    } else if (statusCode === 403) {
      this.handleForbidden(statusCode);
    } else if (statusCode === 429) {
      this.handleTooManyRequests(statusCode);
    } else if (statusCode >= 500) {
      this.handleServerError(statusCode);
    } else {
      this.handleClientError(statusCode);
    }
  }

  private handleUnauthorized(statusCode: number): never {
    throw new TokenExpiredException("Token expired or invalid", statusCode);
  }

  private handleForbidden(statusCode: number): never {
    throw new AuthenticationException(
      "Access forbidden - insufficient permissions",
      statusCode,
    );
  }

  private handleTooManyRequests(statusCode: number): never {
    throw new RateLimitException("Too many requests - please try again later", statusCode);
  }

  private handleServerError(statusCode: number): never {
    throw new ApiException("Server error - please try again later", statusCode);
  }

  private handleClientError(statusCode: number): never {
    throw new ApiException(`Request failed with status ${String(statusCode)}`, statusCode);
  }
}
