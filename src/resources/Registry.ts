import { AbstractResource } from "./AbstractResource.js";

export class Registry extends AbstractResource {
  async create(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "registry", params);
  }

  async addShipments(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", `registry/${id}/shipments`, params);
  }

  async removeShipments(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("DELETE", `registry/${id}/shipments`, params);
  }

  async rename(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("PUT", `registry/${id}/rename`, params);
  }

  async delete(id: string): Promise<unknown> {
    return await this.sendRequest("DELETE", `registry/${id}`);
  }
}
