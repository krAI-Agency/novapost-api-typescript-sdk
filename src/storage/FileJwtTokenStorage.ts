import { createHash } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { JwtTokenStorageInterface } from "./JwtTokenStorageInterface.js";

function defaultTokenFilePath(apiKey: string): string {
  const hash = createHash("md5").update(apiKey, "utf8").digest("hex");
  return join(tmpdir(), `${hash}.json`);
}

export class FileJwtTokenStorage implements JwtTokenStorageInterface {
  private readonly filePath: string;

  /**
   * @param apiKey - Nova Post API key; used to derive a unique cache file name (MD5 hex + `.json` in the system temp directory).
   * @param filePath - Optional absolute path override (for tests or custom locations).
   */
  constructor(apiKey: string, filePath?: string) {
    this.filePath = filePath ?? defaultTokenFilePath(apiKey);
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
