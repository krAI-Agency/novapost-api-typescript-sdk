import { phpHttpBuildQuery } from "../http/phpHttpBuildQuery.js";
import type { HttpClientInterface } from "../http/HttpClientInterface.js";
import { NOVAPOST_REQUEST_URL_PLACEHOLDER } from "../http/urlPlaceholder.js";

export abstract class AbstractResource {
  constructor(protected readonly client: HttpClientInterface) {}

  /**
   * Send an HTTP request to the Nova Post API.
   */
  protected async sendRequest(
    method: string,
    uri: string,
    data: Record<string, unknown> = {},
  ): Promise<unknown> {
    let body: string | undefined;
    if (Object.keys(data).length > 0 && ["POST", "PUT", "PATCH"].includes(method)) {
      body = JSON.stringify(data);
    }

    let finalUri = uri;
    if (method === "GET" && Object.keys(data).length > 0) {
      finalUri += `?${phpHttpBuildQuery(data)}`;
    }

    const headers = new Headers();
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
      headers.set("User-Agent", "NovaPost-SDK/1.0");
    }

    // Request requires absolute URL in Node; FetchHttpClient remaps this placeholder to configured base URL.
    const requestUrl = new URL(finalUri, NOVAPOST_REQUEST_URL_PLACEHOLDER);
    const request = new Request(requestUrl, { method, headers, body: body ?? null });
    const response = await this.client.sendRequest(request);
    const contents = await response.text();

    try {
      return JSON.parse(contents) as unknown;
    } catch {
      return contents;
    }
  }
}
