import { AbstractResource } from "./AbstractResource.js";

export class Webhooks extends AbstractResource {
  async list(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("GET", "tracking-push/subscribers", params);
  }

  async create(params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", "tracking-push/subscribers", params);
  }

  async update(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("PUT", `tracking-push/subscribers/${id}`, params);
  }

  async delete(id: string): Promise<unknown> {
    return await this.sendRequest("DELETE", `tracking-push/subscribers/${id}`);
  }

  async addNumbers(id: string, params: Record<string, unknown>): Promise<unknown> {
    return await this.sendRequest("POST", `tracking-push/subscribers/${id}/numbers`, params);
  }

  async test(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("POST", "tracking-push/subscribers/test-webhook", params);
  }
}
