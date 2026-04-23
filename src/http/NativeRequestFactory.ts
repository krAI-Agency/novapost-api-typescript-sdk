import type { RequestFactoryInterface } from "./RequestFactoryInterface.js";
import { NOVAPOST_REQUEST_URL_PLACEHOLDER } from "./urlPlaceholder.js";

export class NativeRequestFactory implements RequestFactoryInterface {
  createRequest(method: string, uri: string): Request {
    const requestUrl = new URL(uri, NOVAPOST_REQUEST_URL_PLACEHOLDER);
    return new Request(requestUrl, { method });
  }
}
