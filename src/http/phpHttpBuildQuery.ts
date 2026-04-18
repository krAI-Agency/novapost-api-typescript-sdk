/**
 * Serializes query parameters similarly to PHP's `http_build_query` for flat arrays.
 */
export function phpHttpBuildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];

  const append = (key: string, value: unknown): void => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        append(`${key}[${String(index)}]`, item);
      });
      return;
    }

    if (typeof value === "object") {
      for (const [childKey, childVal] of Object.entries(value as Record<string, unknown>)) {
        append(`${key}[${childKey}]`, childVal);
      }
      return;
    }

    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  };

  for (const [key, value] of Object.entries(params)) {
    append(key, value);
  }

  return parts.join("&");
}
