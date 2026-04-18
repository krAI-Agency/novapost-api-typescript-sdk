import type { RequestFactoryInterface } from "./RequestFactoryInterface.js";

export class NativeRequestFactory implements RequestFactoryInterface {
  createRequest(method: string, uri: string): Request {
    return new Request(uri, { method });
  }
}
