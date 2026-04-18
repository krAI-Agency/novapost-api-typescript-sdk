import { describe, expect, it, vi } from "vitest";
import { ApiException } from "../exceptions/ApiException.js";
import { AuthenticationException } from "../exceptions/AuthenticationException.js";
import { TokenExpiredException } from "../exceptions/TokenExpiredException.js";
import { TokenRefreshException } from "../exceptions/TokenRefreshException.js";
import type { LoggerInterface } from "../logger/LoggerInterface.js";
import type { TokenProviderInterface } from "../TokenProviderInterface.js";
import { NovaPostClient } from "./NovaPostClient.js";
import type { ResponseValidatorInterface } from "./ResponseValidatorInterface.js";
import type { RetryHandlerInterface } from "./RetryHandlerInterface.js";
import type { HttpClientInterface } from "./HttpClientInterface.js";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

describe("NovaPostClient", () => {
  it("sends requests with an Authorization header", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "jwt-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: vi.fn(() => false),
      handleRetry: vi.fn(async () => {
        throw new Error("not used");
      }),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    let lastRequest: Request | undefined;
    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async (request: Request) => {
        lastRequest = request;
        return jsonResponse({ data: "test" });
      }),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    const response = await client.sendRequest(new Request("https://example.com/test"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: "test" });

    expect(lastRequest?.headers.get("Authorization")).toBe("jwt-token");
    expect(responseValidator.validate).toHaveBeenCalledTimes(1);
  });

  it("handles token expiration with retry", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi
        .fn()
        .mockResolvedValueOnce("expired-token")
        .mockResolvedValueOnce("refreshed-token")
        .mockResolvedValue("refreshed-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    let validateCalls = 0;
    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(() => {
        validateCalls += 1;
        if (validateCalls === 1) {
          throw new TokenExpiredException("Token expired");
        }
      }),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async (request: Request) => {
        if (request.headers.get("Authorization") === "expired-token") {
          return jsonResponse({ message: "Token expired" }, { status: 401 });
        }
        return jsonResponse({ data: "success" });
      }),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: (exception: unknown) => exception instanceof TokenExpiredException,
      handleRetry: async (request, exception) => {
        if (!(exception instanceof TokenExpiredException)) {
          throw exception;
        }

        const refreshedToken = await tokenProvider.refresh();
        const headers = new Headers();
        request.headers.forEach((value, key) => {
          if (key.toLowerCase() === "authorization") {
            return;
          }
          headers.append(key, value);
        });
        headers.set("Authorization", refreshedToken);

        const retryClient = new NovaPostClient(
          httpClient,
          tokenProvider,
          responseValidator,
          retryHandler,
          logger,
        );

        return await retryClient.sendRequest(new Request(request, { headers }));
      },
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    const response = await client.sendRequest(new Request("https://example.com/secure"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: "success" });
    expect(validateCalls).toBe(2);
  });

  it("throws ApiException when validation fails with ApiException", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "valid-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(() => {
        throw new ApiException("Bad Request", 400);
      }),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: vi.fn(() => false),
      handleRetry: vi.fn(async () => new Response()),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async () => jsonResponse({ error: "Bad Request" }, { status: 400 })),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    await expect(client.sendRequest(new Request("https://example.com/error"))).rejects.toMatchObject({
      message: "Bad Request",
    });
  });

  it("throws TokenRefreshException when refresh fails", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "expired-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(() => {
        throw new TokenExpiredException("Token expired");
      }),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: () => true,
      handleRetry: vi.fn(async () => {
        throw new TokenRefreshException("Failed to refresh token");
      }),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async () => jsonResponse({ message: "Token expired" }, { status: 401 })),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    await expect(client.sendRequest(new Request("https://example.com/secure"))).rejects.toMatchObject({
      message: "Failed to refresh token",
    });
  });

  it("throws ApiException on server errors", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "valid-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(() => {
        throw new ApiException("Server error", 500);
      }),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: vi.fn(() => false),
      handleRetry: vi.fn(async () => new Response()),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async () => jsonResponse({ error: "Internal Server Error" }, { status: 500 })),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    await expect(client.sendRequest(new Request("https://example.com/server-error"))).rejects.toMatchObject({
      message: "Server error",
    });
  });

  it("throws AuthenticationException when validation fails with AuthenticationException", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "invalid-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(() => {
        throw new AuthenticationException("Invalid credentials");
      }),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: vi.fn(() => false),
      handleRetry: vi.fn(async () => new Response()),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async () => jsonResponse({ message: "Invalid credentials" }, { status: 401 })),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    await expect(client.sendRequest(new Request("https://example.com/auth"))).rejects.toMatchObject({
      message: "Invalid credentials",
    });
  });

  it("supports common HTTP methods", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "jwt-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: vi.fn(() => false),
      handleRetry: vi.fn(async () => new Response()),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    let lastRequest: Request | undefined;
    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async (request: Request) => {
        lastRequest = request;
        return jsonResponse({ method: request.method });
      }),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
    for (const method of methods) {
      const response = await client.sendRequest(new Request("https://example.com/test", { method }));
      expect(lastRequest?.method).toBe(method);
      expect(await response.json()).toEqual({ method });
    }

    expect(responseValidator.validate).toHaveBeenCalledTimes(methods.length);
  });

  it("logs unexpected errors during validation", async () => {
    const tokenProvider: TokenProviderInterface = {
      get: vi.fn(async () => "valid-token"),
      refresh: vi.fn(async () => "refreshed-token"),
    };

    const responseValidator: ResponseValidatorInterface = {
      validate: vi.fn(() => {
        throw new Error("Network error");
      }),
    };

    const retryHandler: RetryHandlerInterface = {
      shouldRetry: vi.fn(() => false),
      handleRetry: vi.fn(async () => new Response()),
    };

    const logger: LoggerInterface = { error: vi.fn() };

    const httpClient: HttpClientInterface = {
      sendRequest: vi.fn(async () => new Response("invalid-json", { status: 200 })),
    };

    const client = new NovaPostClient(
      httpClient,
      tokenProvider,
      responseValidator,
      retryHandler,
      logger,
    );

    await expect(client.sendRequest(new Request("https://example.com/network-error"))).rejects.toMatchObject({
      message: "Unexpected error while sending request",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Unexpected error during request",
      expect.objectContaining({
        exception: expect.any(Error),
      }),
    );
  });
});
