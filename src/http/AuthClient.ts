import { ApiException } from "../exceptions/ApiException.js";
import { AuthenticationException } from "../exceptions/AuthenticationException.js";
import type { LoggerInterface } from "../logger/LoggerInterface.js";
import type { AuthClientInterface } from "./AuthClientInterface.js";
import type { HttpClientInterface } from "./HttpClientInterface.js";
import type { RequestFactoryInterface } from "./RequestFactoryInterface.js";

const ENDPOINT_TEMPLATE = "clients/authorization?apiKey=%s";

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  401: "Invalid API key or unauthorized access",
  403: "Access forbidden - check API key permissions",
  429: "Rate limit exceeded - please try again later",
};

export class AuthClient implements AuthClientInterface {
  constructor(
    private readonly httpClient: HttpClientInterface,
    private readonly requestFactory: RequestFactoryInterface,
    private readonly logger: LoggerInterface,
    private readonly apiKey: string,
  ) {}

  async getToken(): Promise<string> {
    try {
      const request = this.createAuthRequest();
      const response = await this.httpClient.sendRequest(request);
      this.validateHttpResponse(response.status);

      return await this.extractTokenFromResponse(response);
    } catch (error) {
      if (error instanceof AuthenticationException || error instanceof ApiException) {
        throw error;
      }

      if (error instanceof TypeError || (error instanceof Error && error.name === "AbortError")) {
        this.logger.error("Authentication request failed", {
          exception: error,
          endpoint: ENDPOINT_TEMPLATE.replace("%s", "[REDACTED]"),
        });
        throw new AuthenticationException(
          `Authentication request failed: ${error.message}`,
          0,
          error,
        );
      }

      this.logger.error("Unexpected error during authentication", {
        exception: error,
        endpoint: ENDPOINT_TEMPLATE.replace("%s", "[REDACTED]"),
      });

      const code = error instanceof Error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;

      throw new ApiException(
        "Unexpected error during authentication",
        Number.isFinite(code) ? code : 0,
        error,
      );
    }
  }

  private createAuthRequest(): Request {
    return this.requestFactory.createRequest(
      "GET",
      ENDPOINT_TEMPLATE.replace("%s", encodeURIComponent(this.apiKey)),
    );
  }

  private validateHttpResponse(statusCode: number): void {
    if (statusCode < 400) {
      return;
    }

    this.logger.error("Authentication failed", {
      status_code: statusCode,
      endpoint: ENDPOINT_TEMPLATE.replace("%s", "[REDACTED]"),
    });

    const errorMessage = this.getErrorMessage(statusCode);

    if (statusCode >= 500) {
      throw new ApiException(errorMessage, statusCode);
    }

    throw new AuthenticationException(errorMessage, statusCode);
  }

  private getErrorMessage(statusCode: number): string {
    return HTTP_STATUS_MESSAGES[statusCode] ??
      `Authentication failed with status ${String(statusCode)}`;
  }

  private async extractTokenFromResponse(response: Response): Promise<string> {
    const content = await response.text();
    let data: unknown;

    try {
      data = JSON.parse(content) as unknown;
    } catch (error) {
      const jsonError = error instanceof Error ? error.message : "Invalid JSON";
      this.logger.error("Authentication response JSON decode failed", {
        error: jsonError,
        content_length: String(content.length),
      });
      throw new ApiException(`Invalid JSON response from authentication server: ${jsonError}`);
    }

    if (!data || typeof data !== "object") {
      throw new ApiException("Invalid JSON response from authentication server");
    }

    const jwt = (data as { jwt?: unknown }).jwt;
    if (typeof jwt !== "string" || jwt.length === 0) {
      this.logger.error("JWT token not found in authentication response", {
        available_keys: Object.keys(data as object),
      });
      throw new AuthenticationException(
        "Authentication failed: JWT token not found in response",
      );
    }

    return jwt;
  }
}
