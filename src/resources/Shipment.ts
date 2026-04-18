import { AbstractResource } from "./AbstractResource.js";

export class Shipment extends AbstractResource {
  async create(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "shipments", params);
  }

  async get(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("GET", "shipments", params);
  }

  async update(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("PUT", `shipments/${id}`, params);
  }

  async delete(idOrNumber: string): Promise<unknown> {
    return await this.sendRequest("DELETE", `shipments/${idOrNumber}`);
  }

  async calculate(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "shipments/calculations", params);
  }

  async print(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("GET", "shipments/print", params);
  }

  async attachDocument(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", `shipments/uploads/${id}`, params);
  }

  async listAttachments(number: string): Promise<unknown> {
    return await this.sendRequest("GET", `shipments/${number}/attachments`);
  }

  async downloadAttachment(number: string, fileId: string): Promise<unknown> {
    return await this.sendRequest("GET", `shipments/${number}/attachments/${fileId}`);
  }

  async tracking(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("GET", "shipments/tracking", params);
  }

  async trackingHistory(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("GET", "shipments/tracking/history", params);
  }

  async createLightReturn(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "shipments/light-return", params);
  }

  async getInternationalStatus(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("GET", "shipments/international/status", params);
  }

  async uploadDocument(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", `shipments/uploads/${id}`, params);
  }
}
