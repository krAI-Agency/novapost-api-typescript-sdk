# NovaPost API SDK for Node.js (TypeScript)

This package is a TypeScript port of the official PHP SDK `[NovaDigitalHub/novapost-api-sdk](https://github.com/NovaDigitalHub/novapost-api-sdk)`. It provides the same architecture (dependency injection, JWT token handling, resource-based API surface) while using modern Node.js primitives (`fetch`, native `Request` / `Response`, and `async` / `await`).

The upstream OpenAPI specification is included as `spec.yaml` (identical to the PHP repository).

## Requirements

- Node.js **18+** (global `fetch`)

## Usage

### Basic client

```ts
import { ApiException, Division, NovaPostApiFactory } from "@novadigital/novapost-api-sdk";

const apiKey = process.env.API_KEY ?? "";

try {
  const novaPostApi = new NovaPostApiFactory().create(apiKey, undefined, false);

  const searchParams = {
    textSearch: "berlin",
    divisionCategories: [Division.DIVISION_CATEGORY_POSTOMAT],
  };

  const divisions = await novaPostApi.divisions().get(searchParams);
  console.log(divisions);
} catch (error) {
  if (error instanceof ApiException) {
    console.error("API Error:", error.message);
  } else {
    console.error(error);
  }
}
```

### Shipment cost calculation

```ts
import { ApiException, NovaPostApiFactory } from "@novadigital/novapost-api-sdk";

const apiKey = process.env.API_KEY ?? "";

try {
  const novaPostApi = new NovaPostApiFactory().create(apiKey);
  const shipmentData = {
    // ... add your shipment calculation data here
  };

  const calculationResult = await novaPostApi.shipments().calculate(shipmentData);
  console.log(calculationResult);
} catch (error) {
  if (error instanceof ApiException) {
    console.error("API Error:", error.message);
  } else {
    console.error(error);
  }
}
```

### Callable factory (PHP `__invoke` parity)

```ts
import { NovaPostApiFactory } from "@novadigital/novapost-api-sdk";

const novaPostApi = new NovaPostApiFactory().invoke(apiKey, undefined, false);
```

### Advanced usage: overriding services

The PHP SDK documents overrides for logging, HTTP client behavior, JWT storage, response validation, and retry handling. This TypeScript SDK exposes the same extension points via `ContainerBuilder.instance(...)` using `CONTAINER_KEYS`:

- `CONTAINER_KEYS.Logger`
- `CONTAINER_KEYS.HttpClient`
- `CONTAINER_KEYS.RequestFactory`
- `CONTAINER_KEYS.AuthClient`
- `CONTAINER_KEYS.JwtTokenStorage`
- `CONTAINER_KEYS.TokenProvider`
- `CONTAINER_KEYS.ResponseValidator`
- `CONTAINER_KEYS.RetryHandler`
- `CONTAINER_KEYS.NovaPostClient`

```ts
import { ContainerBuilder, CONTAINER_KEYS, NovaPostApiFactory } from "@novadigital/novapost-api-sdk";
import type { LoggerInterface } from "@novadigital/novapost-api-sdk";

class MyLogger implements LoggerInterface {
  error(message: string, context?: Record<string, unknown>): void {
    console.error(message, context);
  }
}

const containerBuilder = new ContainerBuilder().instance(CONTAINER_KEYS.Logger, new MyLogger());

const novaPostApi = new NovaPostApiFactory().create(apiKey, containerBuilder, useSandbox);
```

### Sandbox mode

```ts
new NovaPostApiFactory().create(apiKey, undefined, true);
```

## Differences vs the PHP SDK

- Network I/O is **async** (`Promise`-returning methods).
- The default HTTP implementation is `**fetch`** (`FetchHttpClient`) instead of Guzzle, while preserving the same request flow (base URL, auth header injection, validation, token refresh retry).
- JWT persistence uses the same on-disk JSON format and default temp directory file name as the PHP SDK (`novapost_api_sdk_jwt_token.json`).

## Examples

After `npm run build`, you can run the bundled examples with environment variables:

```bash
API_KEY="your_key" USE_SANDBOX=true node examples/divisions.mjs
```

## License

This project is licensed under the GNU General Public License v3.0 or later — see `LICENSE.md`.