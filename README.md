# NovaPost API SDK for Node.js (TypeScript)

This package is a TypeScript port of the official PHP SDK [NovaDigitalHub/novapost-api-sdk](https://github.com/NovaDigitalHub/novapost-api-sdk). It provides the same architecture (dependency injection, JWT token handling, resource-based API surface) while using modern Node.js primitives (`fetch`, native `Request` / `Response`, and `async` / `await`).

The upstream OpenAPI specification is included as `spec.yaml` (identical to the PHP repository).

## Requirements

- Node.js **18+** (global `fetch`)

## Cursor subagent (integration helper)

This repository includes a **Cursor subagent** that guides step-by-step integration of the SDK into your application (install from npm or GitHub Packages, `.npmrc` and tokens, environment variables, `NovaPostApiFactory`, sandbox mode, optional `ContainerBuilder` overrides, and error handling).


| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Agent name** | `novapost-sdk-integrator`                                                                |
| **Agent file** | `[.cursor/agents/novapost-sdk-integrator.md](.cursor/agents/novapost-sdk-integrator.md)` |


In Cursor, ask to use that subagent when you want help wiring Nova Post into a host project—for example: *“Use the novapost-sdk-integrator subagent to add this SDK to my API with `API_KEY` from the environment.”* Commit `.cursor/agents/` so teammates get the same agent.

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

## API reference

Method bodies call the [Nova Post HTTP API](https://api.novapost.com/developers/index.html). Request payloads and query shapes follow that specification; the tables below describe how this SDK maps them to TypeScript. Unless noted, methods return `Promise<unknown>` (parsed JSON when the response body is JSON, otherwise the raw response string).

### Request encoding

- **GET** requests append `params` as a query string (arrays use indexed keys, similar to PHP `http_build_query`).
- **POST**, **PUT**, and **PATCH** send `params` as a JSON body with `Content-Type: application/json` and `User-Agent: NovaPost-SDK/1.0`.
- **DELETE** with a `params` object does not attach a JSON body in this SDK (parity with the PHP implementation). Prefer endpoints that encode identifiers in the path or query only.

### `NovaPostApiFactory`


| Method                                           | Parameters                                                                                                                                                                                                                                                                              | Returns       | Description                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------- |
| `create(apiKey, containerBuilder?, useSandbox?)` | `apiKey` (string): Nova Post API key used for `clients/authorization` and scoped JWT cache file name. `containerBuilder` (optional `ContainerBuilder`): custom DI wiring. `useSandbox` (boolean, default `false`): when `true`, uses sandbox base URL (`NovaPostApi.SANDBOX_BASE_URL`). | `NovaPostApi` | Builds the container and API client.        |
| `invoke(apiKey, containerBuilder?, useSandbox?)` | Same as `create`.                                                                                                                                                                                                                                                                       | `NovaPostApi` | Alias for `create` (PHP `__invoke` parity). |


### `NovaPostApi`

Static constants (same values as the HTTP API base paths):


| Constant                          | Value                                  |
| --------------------------------- | -------------------------------------- |
| `NovaPostApi.PRODUCTION_BASE_URL` | `https://api.novapost.com/v.1.0/`      |
| `NovaPostApi.SANDBOX_BASE_URL`    | `https://api-stage.novapost.pl/v.1.0/` |


Resource accessors (each returns a singleton resource instance for this `NovaPostApi` instance):


| Method            | Returns        | Description                                                                        |
| ----------------- | -------------- | ---------------------------------------------------------------------------------- |
| `dictionary()`    | `Dictionary`   | Measurement units, currencies, classifiers, customs fees.                          |
| `divisions()`     | `Division`     | Branches, postomats, PUDO, etc.                                                    |
| `shipments()`     | `Shipment`     | Shipments, calculations, labels, tracking, uploads.                                |
| `exchangeRates()` | `ExchangeRate` | Currency conversion.                                                               |
| `pickups()`       | `Pickup`       | Courier pickups and time intervals.                                                |
| `subscriptions()` | `Subscription` | Tracking push subscribers (same HTTP surface as webhooks).                         |
| `webhooks()`      | `Webhooks`     | Same endpoints as `subscriptions()`; use whichever name fits your domain language. |
| `registry()`      | `Registry`     | Shipment registries (UA→World flows).                                              |


### `ContainerBuilder`

Fluent builder used by `NovaPostApiFactory`. Call `setParameter` / `instance` / `bind` before `build()`.


| Method                         | Parameters                                                                     | Returns     | Description                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| `setParameter(key, value)`     | `key` (string), `value` (unknown).                                             | `this`      | Sets a container parameter. See **Container parameters** below.                |
| `instance(id, instance)`       | `id` (string): use `CONTAINER_KEYS.`*. `instance` (unknown): concrete service. | `this`      | Registers a pre-built service (e.g. custom logger or JWT storage).             |
| `bind(abstractId, concreteId)` | Two strings.                                                                   | `this`      | Reserved for parity with the PHP SDK; prefer `instance()` for overrides today. |
| `build()`                      | —                                                                              | `Container` | Finalizes the container (not usually needed directly; the factory calls this). |


#### Container parameters


| Key          | Type                                                  | Description                                                                                                                          |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `apiKey`     | `string`                                              | Required. API key for authentication.                                                                                                |
| `useSandbox` | `boolean`                                             | When truthy, `FetchHttpClient` uses `NOVAPOST_SANDBOX_BASE_URL`.                                                                     |
| `config`     | `{ fetchInit?: RequestInit; fetchFn?: typeof fetch }` | Optional. `fetchInit` is merged into every `fetch` call (headers, agent, etc.). `fetchFn` replaces global `fetch` (useful in tests). |


### `CONTAINER_KEYS`

Exported map of service ids for `ContainerBuilder.instance(CONTAINER_KEYS.Logger, myLogger)` and similar. Keys include `Logger`, `HttpClient`, `RequestFactory`, `AuthClient`, `JwtTokenStorage`, `TokenProvider`, `ResponseValidator`, `RetryHandler`, and `NovaPostClient`. Values are stable string tokens (see `src/di/containerKeys.ts`).

### `Dictionary`


| Method                     | Parameters                                                                                                     | HTTP                                        | Description                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| `measurements(params?)`    | `params`: optional query object.                                                                               | GET `dictionary/measurements`               | List of measurement units.                    |
| `currencies(params?)`      | `params`: optional query object (e.g. filter by `codes`).                                                      | GET `dictionary/currencies`                 | Supported currencies.                         |
| `cargoClassifiers(params)` | `params`: required. Must include destination `country-code` and `keyword`; optional `fuzzy`, `locale`, `size`. | GET `dictionary/classifier`                 | Cargo classifiers (UKT ZED / HS-style codes). |
| `customsFees(countryCode)` | `countryCode`: ISO 3166-1 alpha-2 (e.g. `PL`).                                                                 | GET `dictionary/customs-fees/{countryCode}` | Customs-fee settings for that country.        |


### `Division`

**Constants** (for `divisionCategories` and similar filters): `DIVISION_CATEGORY_CARGO_BRANCH`, `DIVISION_CATEGORY_POST_BRANCH`, `DIVISION_CATEGORY_POSTOMAT`, `DIVISION_CATEGORY_PUDO` (string values: `CargoBranch`, `PostBranch`, `Postomat`, `PUDO`).


| Method         | Parameters                                                                                                                               | HTTP            | Description                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------- |
| `get(params?)` | `params`: optional. Common keys: `textSearch` (string), `countryCodes` (string[]), `divisionCategories` (string[], use constants above). | GET `divisions` | List divisions / parcel lockers matching filters. |


### `Shipment`


| Method                               | Parameters                                                                                                                                                                                          | HTTP                                          | Description                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `create(params)`                     | `params`: sender, recipient, parcels, services, etc. per API.                                                                                                                                       | POST `shipments`                              | Create a shipment.                                                                  |
| `get(params?)`                       | `params`: optional; e.g. `numbers` (string[]) to filter.                                                                                                                                            | GET `shipments`                               | List shipments.                                                                     |
| `update(id, params)`                 | `id`: shipment ref UUID. `params`: full update payload.                                                                                                                                             | PUT `shipments/{id}`                          | Update shipment.                                                                    |
| `delete(idOrNumber)`                 | `idOrNumber`: ref ID or (Europe) shipment number.                                                                                                                                                   | DELETE `shipments/{idOrNumber}`               | Delete shipment.                                                                    |
| `calculate(params)`                  | `params`: route, parcels, `payerType` (`Sender`                                                                                                                                                     | `Recipient`                                   | `ThirdPerson`), optional `payerContractNumber` for third-party payer in EU / EU→UA. |
| `print(params)`                      | `params`: `numbers` (string[]), `type` (`marking`                                                                                                                                                   | `international`                               | `invoice`), optional `printSizeType`, `deliveryType`.                               |
| `attachDocument(id, params)`         | `id`: shipment ref. `params`: must include base64 `file`; optional `fileName`, `fileContentType`.                                                                                                   | POST `shipments/uploads/{id}`                 | Attach supporting document.                                                         |
| `uploadDocument(id, params)`         | Same URL as `attachDocument`; same body shape.                                                                                                                                                      | POST `shipments/uploads/{id}`                 | Alias-style duplicate of PHP SDK.                                                   |
| `listAttachments(number)`            | `number`: shipment number (e.g. `SHDE…`).                                                                                                                                                           | GET `shipments/{number}/attachments`          | List attachment metadata.                                                           |
| `downloadAttachment(number, fileId)` | `fileId`: UUID from list.                                                                                                                                                                           | GET `shipments/{number}/attachments/{fileId}` | Download binary or JSON error.                                                      |
| `tracking(params)`                   | `params`: `numbers` or `ids` (string[]), or date range `trackingDateFrom` / `trackingDateTo` (ISO 8601); optional flags `withUndeliveryReason`, `withCreatedOnTheBasis`, `countryCode`, `external`. | GET `shipments/tracking`                      | Full tracking.                                                                      |
| `trackingHistory(params)`            | Same identification rules as `tracking`; optional `extended`.                                                                                                                                       | GET `shipments/tracking/history`              | Lighter history.                                                                    |
| `createLightReturn(params)`          | `params`: must include `number` (parent shipment); optional `divisionId`, `senderPhone`, `addressParts`, `invoice`, `parcels`.                                                                      | POST `shipments/light-return`                 | Light return after delivery.                                                        |
| `getInternationalStatus(params)`     | `params`: `refs` (string[], non-empty), `state` (`Order`                                                                                                                                            | `Closed`                                      | `allOrders`).                                                                       |


### `Pickup`


| Method                        | Parameters                                                                                                                                                       | HTTP                                                  | Description                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- |
| `get(params?)`                | Optional `ids` or `numbers` (string[]).                                                                                                                          | GET `pickups`                                         | List pickup requests.              |
| `create(params)`              | Address, window, contact fields per API.                                                                                                                         | POST `pickups`                                        | Create pickup (starts in `Draft`). |
| `update(id, params)`          | `id`: pickup UUID.                                                                                                                                               | PUT `pickups/{id}`                                    | Update draft pickup.               |
| `delete(id)`                  | `id`: pickup UUID.                                                                                                                                               | DELETE `pickups/{id}`                                 | Delete pickup.                     |
| `addShipments(id, params)`    | `params`: `{ shipments: string[] }` (shipment IDs). Pickup must be `Draft`.                                                                                      | POST `pickups/{id}/shipments`                         | Add shipments to pickup.           |
| `removeShipments(id, params)` | `params`: `{ shipments: string[] }`. **Note:** body is not sent on DELETE in this SDK; confirm API behavior or use a custom client if the server expects a body. | DELETE `pickups/{id}/shipments`                       | Remove shipments from pickup.      |
| `updateStatus(id, params?)`   | `params`: `lockVersion` (number), `status` (e.g. `Created`), optional `note`.                                                                                    | PUT `pickups/{id}/status`                             | Finalize pickup.                   |
| `findTimeIntervals(params?)`  | Required: `countryCode`, `type` (`PickupDayToDay`                                                                                                                | `PickupNextDay`); optional address/geo/weight fields. | POST `time-intervals/find`         |


### `ExchangeRate`


| Method            | Parameters                                                                                                 | HTTP                             | Description                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------- |
| `convert(params)` | Required: `countryCode`, `currencyCode`, `amount` (two decimal places as per API), `date` (ISO date-time). | POST `exchange-rates/conversion` | Convert amount to multiple currencies. |


### `Subscription` and `Webhooks`

Identical method sets; both talk to `tracking-push/subscribers`.


| Method                   | Parameters                                                              | HTTP                                          | Description                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list(params?)`          | Optional query filters.                                                 | GET `tracking-push/subscribers`               | List subscriptions.                                                                                                                                             |
| `create(params)`         | Required: `type` (`individual`                                          | `numbers`                                     | `legal`), `url` (callback HTTPS URL), `isActive` (boolean). Optional: `phone`, `secretToken`, `eventTypes`, `sendWarnings`, `warningEmail`, `companyTins`, etc. |
| `update(id, params)`     | Same shape as `create`.                                                 | PUT `tracking-push/subscribers/{id}`          | Update subscription.                                                                                                                                            |
| `delete(id)`             | Subscription id.                                                        | DELETE `tracking-push/subscribers/{id}`       | Delete subscription.                                                                                                                                            |
| `addNumbers(id, params)` | `params`: `{ numbers: string[] }`. Subscription type must be `numbers`. | POST `tracking-push/subscribers/{id}/numbers` | Attach shipment numbers.                                                                                                                                        |
| `test(params?)`          | Optional body per API.                                                  | POST `tracking-push/subscribers/test-webhook` | Test webhook delivery.                                                                                                                                          |


### `Registry`


| Method                        | Parameters                                                                      | HTTP                             | Description                |
| ----------------------------- | ------------------------------------------------------------------------------- | -------------------------------- | -------------------------- |
| `create(params)`              | Required: `description` (string), `shipments` (string[] of shipment ref UUIDs). | POST `registry`                  | Create registry.           |
| `addShipments(id, params)`    | `params`: `{ shipments: string[] }`.                                            | POST `registry/{id}/shipments`   | Add shipments to registry. |
| `removeShipments(id, params)` | `params`: `{ shipments: string[] }`. Same DELETE body caveat as pickups.        | DELETE `registry/{id}/shipments` | Remove shipments.          |
| `rename(id, params)`          | `params`: `{ description: string }`.                                            | PUT `registry/{id}/rename`       | Rename registry.           |
| `delete(id)`                  | Registry UUID.                                                                  | DELETE `registry/{id}`           | Delete registry.           |


### `FileJwtTokenStorage`


| Constructor                                  | Parameters                                                                                                            | Description                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `new FileJwtTokenStorage(apiKey, filePath?)` | `apiKey`: used to compute default path `${tmpdir()}/{md5(apiKey)}.json`. `filePath`: optional absolute path override. | Persists JWT JSON `{ "token": "..." }` compatible with the PHP SDK file format. |


Methods: `save(token)`, `get()` → `Promise<string | null>`, `delete()` (all async in this implementation).

### `TokenProviderInterface` (overrides)


| Method      | Returns           | Description                                             |
| ----------- | ----------------- | ------------------------------------------------------- |
| `get()`     | `Promise<string>` | Returns a valid `Authorization` header value (raw JWT). |
| `refresh()` | `Promise<string>` | Forces a new token and clears storage.                  |


### Exceptions


| Class                                             | Typical cause                                                         | Fields                                              |
| ------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `ApiException`                                    | HTTP or client errors, server errors, generic failures.               | `message`, `statusCode` (number), optional `cause`. |
| `AuthenticationException`                         | Extends `ApiException`; invalid API key, forbidden, auth JSON issues. | Same.                                               |
| `TokenExpiredException`                           | Extends `ApiException`; HTTP 401 from API after token attached.       | Triggers retry in `NovaPostClient`.                 |
| `TokenRefreshException`                           | Extends `ApiException`; refresh flow failed.                          | —                                                   |
| `RateLimitException`                              | Extends `ApiException`; HTTP 429.                                     | —                                                   |
| `ContainerException` / `ServiceNotFoundException` | DI resolution (rare in normal use).                                   | —                                                   |


## Differences vs the PHP SDK

- Network I/O is **async** (`Promise`-returning methods).
- The default HTTP implementation is **fetch** (`FetchHttpClient`) instead of Guzzle, while preserving the same request flow (base URL, auth header injection, validation, token refresh retry).
- JWT persistence uses the same on-disk JSON format as the PHP SDK; the default cache file lives in the system temp directory and is named `{md5(apiKey)}.json` so different API keys do not share a token file.

## GitHub Packages (publishing and installing)

### Publishing

This repository includes `[.github/workflows/publish-github-packages.yml](.github/workflows/publish-github-packages.yml)`, which publishes to the GitHub npm registry (`https://npm.pkg.github.com`).

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