import { AbstractResource } from "./AbstractResource.js";

export class Pickup extends AbstractResource {
  async get(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("GET", "pickups", params);
  }

  async create(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "pickups", params);
  }

  async update(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("PUT", `pickups/${id}`, params);
  }

  async delete(id: string): Promise<unknown> {
    return await this.sendRequest("DELETE", `pickups/${id}`);
  }

  async addShipments(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", `pickups/${id}/shipments`, params);
  }

  async removeShipments(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("DELETE", `pickups/${id}/shipments`, params);
  }

  async updateStatus(id: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("PUT", `pickups/${id}/status`, params);
  }

  async findTimeIntervals(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("POST", "time-intervals/find", params);
  }
}
