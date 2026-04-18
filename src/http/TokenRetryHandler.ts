import { ApiException } from "../exceptions/ApiException.js";
import { TokenExpiredException } from "../exceptions/TokenExpiredException.js";
import type { LoggerInterface } from "../logger/LoggerInterface.js";
import type { TokenProviderInterface } from "../TokenProviderInterface.js";
import type { HttpClientInterface } from "./HttpClientInterface.js";
import type { ResponseValidatorInterface } from "./ResponseValidatorInterface.js";
import type { RetryHandlerInterface } from "./RetryHandlerInterface.js";

export class TokenRetryHandler implements RetryHandlerInterface {
  constructor(
    private readonly httpClient: HttpClientInterface,
    private readonly tokenProvider: TokenProviderInterface,
    private readonly responseValidator: ResponseValidatorInterface,
    private readonly logger: LoggerInterface,
  ) {}

  shouldRetry(exception: unknown): boolean {
    return exception instanceof TokenExpiredException;
  }

  async handleRetry(request: Request, exception: unknown): Promise<Response> {
    if (!this.shouldRetry(exception)) {
      throw exception;
    }

    try {
      const refreshedToken = await this.tokenProvider.refresh();
      const headers = new Headers();
      request.headers.forEach((value, key) => {
        if (key.toLowerCase() === "authorization") {
          return;
        }
        headers.append(key, value);
      });
      headers.set("Authorization", refreshedToken);
      const retryRequest = new Request(request, { headers });

      const response = await this.httpClient.sendRequest(retryRequest);
      this.responseValidator.validate(response);
      return response;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof TypeError || (error instanceof Error && error.name === "AbortError")) {
        this.logger.error("Token refresh failed - HTTP client error", { exception: error });
        throw new ApiException(`Request failed: ${error.message}`, 0, error);
      }

      this.logger.error("Unexpected error during token retry", { exception: error });
      const code = error instanceof Error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;
      throw new ApiException(
        "Unexpected error during retry",
        Number.isFinite(code) ? code : 0,
        error,
      );
    }
  }
}
