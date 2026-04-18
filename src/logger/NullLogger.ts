import type { LoggerInterface } from "./LoggerInterface.js";

export class NullLogger implements LoggerInterface {
  error(_message: string, _context?: Record<string, unknown>): void {
    // intentionally empty — mirrors PSR-3 NullLogger usage in the PHP SDK
  }
}
