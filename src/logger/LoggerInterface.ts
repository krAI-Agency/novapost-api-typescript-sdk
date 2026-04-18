export interface LoggerInterface {
  error(message: string, context?: Record<string, unknown>): void;
}
