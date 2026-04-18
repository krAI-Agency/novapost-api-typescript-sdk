import { AuthenticationException } from "./exceptions/AuthenticationException.js";
import { ApiException } from "./exceptions/ApiException.js";
import { TokenExpiredException } from "./exceptions/TokenExpiredException.js";
import { TokenRefreshException } from "./exceptions/TokenRefreshException.js";
import type { AuthClientInterface } from "./http/AuthClientInterface.js";
import type { JwtTokenStorageInterface } from "./storage/JwtTokenStorageInterface.js";
import type { TokenProviderInterface } from "./TokenProviderInterface.js";

const JWT_TOKEN_EXPIRY_SKEW_SECONDS = 30;
const JWT_TOKEN_PARTS_COUNT = 3;

function base64UrlDecode(segment: string): string {
  const normalized = segment.replaceAll("-", "+").replaceAll("_", "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padLength)}`;
  return Buffer.from(padded, "base64").toString("utf8");
}

async function resolveMaybePromise<T>(value: T | Promise<T>): Promise<T> {
  return await Promise.resolve(value);
}

export class JwtTokenProvider implements TokenProviderInterface {
  private jwtToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private readonly jwtTokenStorage: JwtTokenStorageInterface,
    private readonly authClient: AuthClientInterface,
  ) {}

  async get(): Promise<string> {
    if (this.jwtToken !== null) {
      if (this.isTokenExpired(this.jwtToken)) {
        this.clearCachedToken();
      } else {
        return this.jwtToken;
      }
    }

    const storedToken = await resolveMaybePromise(this.jwtTokenStorage.get());
    if (storedToken !== null) {
      if (this.isTokenExpired(storedToken)) {
        await resolveMaybePromise(this.jwtTokenStorage.delete());
        throw new TokenExpiredException("Stored token has expired");
      }

      this.jwtToken = storedToken;
      return this.jwtToken;
    }

    await this.fetch();
    return this.jwtToken as string;
  }

  async refresh(): Promise<string> {
    try {
      this.clearCachedToken();
      await resolveMaybePromise(this.jwtTokenStorage.delete());
      await this.fetch();
      return this.jwtToken as string;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const code = error instanceof ApiException ? error.statusCode : 0;
      throw new TokenRefreshException(`Failed to refresh token: ${message}`, code, error);
    }
  }

  private async fetch(): Promise<void> {
    this.jwtToken = await this.authClient.getToken();
    this.extractExpiry(this.jwtToken);

    if (this.tokenExpiry === null) {
      throw new AuthenticationException("Invalid JWT token: missing or invalid expiry");
    }

    await resolveMaybePromise(this.jwtTokenStorage.save(this.jwtToken));
  }

  private clearCachedToken(): void {
    this.jwtToken = null;
    this.tokenExpiry = null;
  }

  private isTokenExpired(token: string): boolean {
    if (this.tokenExpiry === null) {
      this.extractExpiry(token);
    }

    return (
      this.tokenExpiry === null ||
      Math.floor(Date.now() / 1000) >= this.tokenExpiry - JWT_TOKEN_EXPIRY_SKEW_SECONDS
    );
  }

  private extractExpiry(token: string): void {
    const parts = token.split(".");
    if (parts.length !== JWT_TOKEN_PARTS_COUNT) {
      this.tokenExpiry = null;
      return;
    }

    let payloadJson: string;
    try {
      payloadJson = base64UrlDecode(parts[1] ?? "");
    } catch {
      this.tokenExpiry = null;
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadJson) as unknown;
    } catch {
      this.tokenExpiry = null;
      return;
    }

    if (!payload || typeof payload !== "object") {
      this.tokenExpiry = null;
      return;
    }

    const exp = (payload as { exp?: unknown }).exp;
    this.tokenExpiry = typeof exp === "number" && Number.isFinite(exp) ? Math.trunc(exp) : null;
  }
}
