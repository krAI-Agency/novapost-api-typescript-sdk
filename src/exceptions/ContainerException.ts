export class ContainerException extends Error {
  override readonly cause?: unknown;

  constructor(message: string, code = 0, cause?: unknown) {
    super(message);
    this.name = "ContainerException";
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof code === "number" && code !== 0) {
      (this as Error & { code?: number }).code = code;
    }
  }

  static circularDependency(serviceId: string): ContainerException {
    return new ContainerException(`Circular dependency detected for service "${serviceId}"`);
  }

  static resolutionFailed(serviceId: string, previous: unknown): ContainerException {
    const msg =
      previous instanceof Error
        ? previous.message
        : typeof previous === "string"
          ? previous
          : "Unknown error";
    return new ContainerException(`Failed to resolve service "${serviceId}": ${msg}`, 0, previous);
  }
}
