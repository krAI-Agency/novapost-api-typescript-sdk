export interface HttpClientInterface {
  sendRequest(request: Request): Promise<Response>;
}
