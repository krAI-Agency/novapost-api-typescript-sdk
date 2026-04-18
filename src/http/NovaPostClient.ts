import { ApiException } from "../exceptions/ApiException.js";
import { TokenExpiredException } from "../exceptions/TokenExpiredException.js";
import type { LoggerInterface } from "../logger/LoggerInterface.js";
import type { TokenProviderInterface } from "../TokenProviderInterface.js";
import type { HttpClientInterface } from "./HttpClientInterface.js";
import type { ResponseValidatorInterface } from "./ResponseValidatorInterface.js";
import type { RetryHandlerInterface } from "./RetryHandlerInterface.js";

export class NovaPostClient implements HttpClientInterface {
  constructor(
    private readonly httpClient: HttpClientInterface,
    private readonly tokenProvider: TokenProviderInterface,
    private readonly responseValidator: ResponseValidatorInterface,
    private readonly retryHandler: RetryHandlerInterface,
    private readonly logger: LoggerInterface,
  ) {}

  async sendRequest(request: Request): Promise<Response> {
    try {
      const token = await this.tokenProvider.get();
      const headers = new Headers();
      request.headers.forEach((value, key) => {
        if (key.toLowerCase() === "authorization") {
          return;
        }
        headers.append(key, value);
      });
      headers.set("Authorization", token);
      const authRequest = new Request(request, { headers });

      const response = await this.httpClient.sendRequest(authRequest);
      this.responseValidator.validate(response);
      return response;
    } catch (error) {
      if (error instanceof TokenExpiredException) {
        return await this.retryHandler.handleRetry(request, error);
      }

      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof TypeError || (error instanceof Error && error.name === "AbortError")) {
        this.logger.error("HTTP request failed", {
          exception: error,
          request_uri: request.url,
          request_method: request.method,
        });
        throw new ApiException(`Request failed: ${error.message}`, 0, error);
      }

      this.logger.error("Unexpected error during request", {
        exception: error,
        request_uri: request.url,
        request_method: request.method,
      });

      const code = error instanceof Error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;

      throw new ApiException(
        "Unexpected error while sending request",
        Number.isFinite(code) ? code : 0,
        error,
      );
    }
  }
}
