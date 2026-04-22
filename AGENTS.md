# Agent and contributor guide

## Project overview

This repository is the **Nova Post API TypeScript SDK** for Node.js (`@novadigital/novapost-api-sdk`). It is a TypeScript port of the official PHP SDK, keeping the same ideas: dependency injection, JWT handling, and a resource-oriented API surface. It targets modern Node.js (`fetch`, native `Request` / `Response`, `async` / `await`). The upstream OpenAPI contract lives in `spec.yaml` (kept aligned with the PHP SDK repository).

**Primary goals:** correctness against the API contract, parity with the PHP SDK’s extension points where reasonable, and a small, predictable public API.

## Tech stack

- **Runtime:** Node.js **18+** (ESM, global `fetch`).
- **Language:** TypeScript **5.x**, **strict** mode (`strict`, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`).
- **Module system:** Source and primary publish output are ESM (`"type": "module"`, `module` / `moduleResolution`: **NodeNext**). A **CommonJS** build is emitted under `dist/cjs/` with `exports.require` so Nest and other CJS runtimes can `require()` the package without `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **Tests:** Vitest (`npm test`, `npm run test:watch`).
- **Build:** `tsc` via `npm run build` (`tsconfig.build.json`); publishable output under `dist/`.

## Repository layout (short)

- `src/` — SDK implementation (HTTP client, DI container, resources, exceptions, storage).
- `examples/` — runnable usage examples (often `.mjs` for quick runs).
- `spec.yaml` — OpenAPI spec; treat as the contract when in doubt.
- `vitest.config.ts` — test runner configuration.

## TypeScript rules

- Match **existing** patterns: naming, file layout, interfaces vs classes, and export style from `src/index.ts`.
- Prefer **explicit types** on public APIs and boundaries; avoid `any`; use `unknown` and narrow when handling external JSON.
- Keep **ESM** imports (include `.js` extensions in relative imports where the codebase already does, per NodeNext resolution).
- Do not relax compiler options in `tsconfig.json` / `tsconfig.build.json` without a strong, documented reason.
- After substantive changes, run `**npm run build`** and `**npm test`** before considering work complete.

## Architecture expectations

- **Resources** live under `src/resources/` and extend shared abstractions where applicable.
- **HTTP** concerns stay in `src/http/`; avoid leaking transport details into resource DTOs unless the API requires it.
- **DI** uses `Container` / `ContainerBuilder` and `CONTAINER_KEYS`; new services should register consistently with existing keys.
- **Errors** use the typed exception hierarchy under `src/exceptions/`; preserve `ApiException` semantics for HTTP/API failures.

## Testing

- Add or update tests next to the code (`*.test.ts`) or as the project already organizes them.
- Prefer focused unit tests for parsing, retries, and error mapping; integration-style tests only when they add clear value and stay stable (no real API keys in the repo).

## Git, branching, and commits (Angular Conventional Commits)

- **Default branch:** `main`. Keep it releasable: build and tests pass.

Follow **[Conventional Commits](https://www.conventionalcommits.org/)** in the **Angular** style: every commit message must be parseable as `type(scope): subject` (scope is optional but preferred when it clarifies the area touched).

**Commit format**

```
<type>(<scope>): <short summary>
```

- **Summary:** imperative mood, **lowercase** after the colon, **no trailing period** (Angular convention).
- **Body / footer:** use when needed for context, breaking changes, or issue references.

**Common `type` values**


| `type`     | Use for                                                   |
| ---------- | --------------------------------------------------------- |
| `feat`     | New user-facing capability or API surface                 |
| `fix`      | Bug fix                                                   |
| `perf`     | Performance improvement                                   |
| `refactor` | Internal change without behavior change                   |
| `test`     | Tests only                                                |
| `build`    | Build system, packaging, `package.json` scripts           |
| `ci`       | CI configuration                                          |
| `docs`     | Documentation and comments meant for readers              |
| `chore`    | Maintenance that does not change production code behavior |
| `revert`   | Reverts a previous commit                                 |


**Breaking changes:** describe in the footer as `BREAKING CHANGE: <explanation>` (or append `!` after `type` / scope when your tooling expects it, e.g. `feat(api)!: drop legacy method`).

**Branches:** branch from `main` using the same **type** prefix and **kebab-case** slug, so branch names mirror commit intent, for example:

- `feat/division-search-filters`
- `fix/token-retry-on-401`
- `refactor/http-client-boundaries`
- `chore/update-dev-dependencies`

Use one primary purpose per branch; squash or keep history consistent with the conventions above before merging.

**Pull requests:** describe behavior change, risk, and how you verified (commands run). The merged result should satisfy Conventional Commits on `main`. Link issues if applicable.

**Never commit secrets:** use `.env.sample` for variable names only; real keys stay local or in CI secrets.

## Scope and dependencies

- This is a **library**, not an app: avoid unnecessary runtime dependencies; prefer Node built-ins where they suffice.
- Changes that affect the **public API** or **published `exports`** deserve extra scrutiny and should be noted for release notes / semver.

## Release and package metadata

- `prepublishOnly` runs build and tests; do not bypass that flow for published artifacts.
- Package `name`, `files`, and `exports` in `package.json` define what consumers get; align changes with README examples.

