export interface RequestFactoryInterface {
  createRequest(method: string, uri: string): Request;
}
