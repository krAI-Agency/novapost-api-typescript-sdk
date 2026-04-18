import { AbstractResource } from "./AbstractResource.js";

export class Dictionary extends AbstractResource {
  async measurements(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("GET", "dictionary/measurements", params);
  }

  async currencies(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("GET", "dictionary/currencies", params);
  }

  async cargoClassifiers(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("GET", "dictionary/classifier", params);
  }

  async customsFees(countryCode: string): Promise<unknown> {
    return await this.sendRequest("GET", `dictionary/customs-fees/${countryCode}`);
  }
}
