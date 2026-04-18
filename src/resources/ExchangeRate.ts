import { AbstractResource } from "./AbstractResource.js";

export class ExchangeRate extends AbstractResource {
  async convert(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "exchange-rates/conversion", params);
  }
}
