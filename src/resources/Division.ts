import { AbstractResource } from "./AbstractResource.js";

export class Division extends AbstractResource {
  static readonly DIVISION_CATEGORY_CARGO_BRANCH = "CargoBranch";
  static readonly DIVISION_CATEGORY_POST_BRANCH = "PostBranch";
  static readonly DIVISION_CATEGORY_POSTOMAT = "Postomat";
  static readonly DIVISION_CATEGORY_PUDO = "PUDO";

  async get(params: Record<string, unknown> = {}): Promise<unknown> {
    return await this.sendRequest("GET", "divisions", params);
  }
}
