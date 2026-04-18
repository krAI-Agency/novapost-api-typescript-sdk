export interface RetryHandlerInterface {
  shouldRetry(exception: unknown): boolean;

  handleRetry(request: Request, exception: unknown): Promise<Response>;
}
