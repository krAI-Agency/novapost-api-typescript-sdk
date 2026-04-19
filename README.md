# NovaPost API SDK for Node.js (TypeScript)

This package is a TypeScript port of the official PHP SDK [NovaDigitalHub/novapost-api-sdk](https://github.com/NovaDigitalHub/novapost-api-sdk). It provides the same architecture (dependency injection, JWT token handling, resource-based API surface) while using modern Node.js primitives (`fetch`, native `Request` / `Response`, and `async` / `await`).

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
- The default HTTP implementation is **fetch** (`FetchHttpClient`) instead of Guzzle, while preserving the same request flow (base URL, auth header injection, validation, token refresh retry).
- JWT persistence uses the same on-disk JSON format as the PHP SDK; the default cache file lives in the system temp directory and is named `{md5(apiKey)}.json` so different API keys do not share a token file.

## GitHub Packages (publishing and installing)

### Publishing

This repository includes [`.github/workflows/publish-github-packages.yml`](.github/workflows/publish-github-packages.yml), which publishes to the GitHub npm registry (`https://npm.pkg.github.com`).

- **On GitHub Release (recommended):** create a GitHub Release from a tag (for example `v1.0.0`). When the release is published, the workflow runs and publishes the version currently set in `package.json`.
- **Manual run:** use **Actions → Publish to GitHub Packages → Run workflow**. You can optionally set the **dist-tag** (defaults to `latest`).

The workflow temporarily renames the package to `@krai-agency/novapost-api-sdk`, which is required because GitHub Packages scopes npm packages to the repository owner ([krAI-Agency](https://github.com/krAI-Agency)).

Before cutting a release, bump the `version` field in `package.json` (and commit the change) so it matches the tag you are releasing.

### Installing from GitHub Packages

In the consuming repository or machine, add an `.npmrc` next to your `package.json`:

```ini
@krai-agency:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

Create a GitHub PAT with `read:packages` (and `repo` if the package is in a private repository), set it as `NPM_TOKEN` in your environment or CI secrets, then install:

```bash
npm install @krai-agency/novapost-api-sdk
```

## Examples

After `npm run build`, you can run the bundled examples with environment variables:

```bash
API_KEY="your_key" USE_SANDBOX=true node examples/divisions.mjs
```

## License

This project is licensed under the GNU General Public License v3.0 or later — see `LICENSE.md`.