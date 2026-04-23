import type { HttpClientInterface } from "./HttpClientInterface.js";
import { NOVAPOST_REQUEST_URL_PLACEHOLDER } from "./urlPlaceholder.js";

export type FetchHttpClientOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
  defaultInit?: RequestInit;
};

export class FetchHttpClient implements HttpClientInterface {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly defaultInit: RequestInit;

  constructor(options: FetchHttpClientOptions) {
    this.baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`;
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.defaultInit = options.defaultInit ?? {};
  }

  sendRequest(request: Request): Promise<Response> {
    const parsed = new URL(request.url, this.baseUrl);
    // Relative SDK paths are materialized using placeholder origin and remapped here.
    const url = parsed.origin === new URL(NOVAPOST_REQUEST_URL_PLACEHOLDER).origin
      ? new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, this.baseUrl)
      : parsed;
    const merged = new Request(url, request);
    return this.fetchFn(merged, this.defaultInit);
  }
}
