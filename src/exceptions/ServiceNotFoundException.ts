export class ServiceNotFoundException extends Error {
  constructor(serviceId: string) {
    super(`Service "${serviceId}" not found in container`);
    this.name = "ServiceNotFoundException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
