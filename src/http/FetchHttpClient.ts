import type { HttpClientInterface } from "./HttpClientInterface.js";

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
    const url = new URL(request.url, this.baseUrl);
    const merged = new Request(url, request);
    return this.fetchFn(merged, this.defaultInit);
  }
}
