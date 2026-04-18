import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { JwtTokenStorageInterface } from "./JwtTokenStorageInterface.js";

const FILE_NAME = "novapost_api_sdk_jwt_token.json";

export class FileJwtTokenStorage implements JwtTokenStorageInterface {
  private readonly filePath: string;

  constructor(filePath = join(tmpdir(), FILE_NAME)) {
    this.filePath = filePath;
  }

  async save(token: string): Promise<void> {
    const data = JSON.stringify({ token });
    await writeFile(this.filePath, data, { encoding: "utf8", flag: "w" });
  }

  async get(): Promise<string | null> {
    try {
      const content = await readFile(this.filePath, { encoding: "utf8" });
      let data: unknown;
      try {
        data = JSON.parse(content) as unknown;
      } catch {
        await unlink(this.filePath).catch(() => undefined);
        return null;
      }

      if (!data || typeof data !== "object" || !("token" in data)) {
        await unlink(this.filePath).catch(() => undefined);
        return null;
      }

      const token = (data as { token?: unknown }).token;
      if (typeof token !== "string" || token.length === 0) {
        await unlink(this.filePath).catch(() => undefined);
        return null;
      }

      return token;
    } catch {
      return null;
    }
  }

  async delete(): Promise<void> {
    await unlink(this.filePath).catch(() => undefined);
  }
}
