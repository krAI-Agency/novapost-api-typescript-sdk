import { NOVAPOST_PRODUCTION_BASE_URL, NOVAPOST_SANDBOX_BASE_URL } from "../config.js";
import { JwtTokenProvider } from "../JwtTokenProvider.js";
import { FileJwtTokenStorage } from "../storage/FileJwtTokenStorage.js";
import type { JwtTokenStorageInterface } from "../storage/JwtTokenStorageInterface.js";
import { AuthClient } from "../http/AuthClient.js";
import type { AuthClientInterface } from "../http/AuthClientInterface.js";
import { FetchHttpClient } from "../http/FetchHttpClient.js";
import { HttpResponseValidator } from "../http/HttpResponseValidator.js";
import { NativeRequestFactory } from "../http/NativeRequestFactory.js";
import { NovaPostClient } from "../http/NovaPostClient.js";
import type { HttpClientInterface } from "../http/HttpClientInterface.js";
import type { RequestFactoryInterface } from "../http/RequestFactoryInterface.js";
import type { ResponseValidatorInterface } from "../http/ResponseValidatorInterface.js";
import { TokenRetryHandler } from "../http/TokenRetryHandler.js";
import type { RetryHandlerInterface } from "../http/RetryHandlerInterface.js";
import type { LoggerInterface } from "../logger/LoggerInterface.js";
import { NullLogger } from "../logger/NullLogger.js";
import type { TokenProviderInterface } from "../TokenProviderInterface.js";
import { CONTAINER_KEYS } from "./containerKeys.js";
import { Container } from "./Container.js";

export class ContainerBuilder {
  private readonly bindings = new Map<string, string>();
  private readonly instances = new Map<string, unknown>();
  private readonly parameters: Record<string, unknown> = {};

  /**
   * Advanced override hook (mirrors the PHP SDK's `ContainerBuilder::bind()`).
   *
   * The TypeScript SDK resolves known services explicitly; for custom implementations,
   * prefer `instance()` with the same service key as in the PHP SDK docs.
   */
  bind(abstractId: string, concreteId: string): this {
    this.bindings.set(abstractId, concreteId);
    return this;
  }

  instance(id: string, instance: unknown): this {
    this.instances.set(id, instance);
    return this;
  }

  setParameter(key: string, value: unknown): this {
    this.parameters[key] = value;
    return this;
  }

  build(): Container {
    this.initHttpClient();

    const instances = new Map(this.instances);
    const factories = new Map<string, (c: Container) => unknown>();

    factories.set(CONTAINER_KEYS.Logger, () => {
      if (instances.has(CONTAINER_KEYS.Logger)) {
        return instances.get(CONTAINER_KEYS.Logger);
      }
      return new NullLogger();
    });

    factories.set(CONTAINER_KEYS.RequestFactory, () => {
      if (instances.has(CONTAINER_KEYS.RequestFactory)) {
        return instances.get(CONTAINER_KEYS.RequestFactory);
      }
      return new NativeRequestFactory();
    });

    factories.set(CONTAINER_KEYS.AuthClient, (c) => {
      if (instances.has(CONTAINER_KEYS.AuthClient)) {
        return instances.get(CONTAINER_KEYS.AuthClient);
      }
      return new AuthClient(
        c.get<HttpClientInterface>(CONTAINER_KEYS.HttpClient),
        c.get<RequestFactoryInterface>(CONTAINER_KEYS.RequestFactory),
        c.get<LoggerInterface>(CONTAINER_KEYS.Logger),
        c.getParameter<string>("apiKey"),
      );
    });

    factories.set(CONTAINER_KEYS.JwtTokenStorage, (c) => {
      if (instances.has(CONTAINER_KEYS.JwtTokenStorage)) {
        return instances.get(CONTAINER_KEYS.JwtTokenStorage);
      }
      return new FileJwtTokenStorage(c.getParameter<string>("apiKey"));
    });

    factories.set(CONTAINER_KEYS.TokenProvider, (c) => {
      if (instances.has(CONTAINER_KEYS.TokenProvider)) {
        return instances.get(CONTAINER_KEYS.TokenProvider);
      }
      return new JwtTokenProvider(
        c.get<JwtTokenStorageInterface>(CONTAINER_KEYS.JwtTokenStorage),
        c.get<AuthClientInterface>(CONTAINER_KEYS.AuthClient),
      );
    });

    factories.set(CONTAINER_KEYS.ResponseValidator, () => {
      if (instances.has(CONTAINER_KEYS.ResponseValidator)) {
        return instances.get(CONTAINER_KEYS.ResponseValidator);
      }
      return new HttpResponseValidator();
    });

    factories.set(CONTAINER_KEYS.RetryHandler, (c) => {
      if (instances.has(CONTAINER_KEYS.RetryHandler)) {
        return instances.get(CONTAINER_KEYS.RetryHandler);
      }
      return new TokenRetryHandler(
        c.get<HttpClientInterface>(CONTAINER_KEYS.HttpClient),
        c.get<TokenProviderInterface>(CONTAINER_KEYS.TokenProvider),
        c.get<ResponseValidatorInterface>(CONTAINER_KEYS.ResponseValidator),
        c.get<LoggerInterface>(CONTAINER_KEYS.Logger),
      );
    });

    factories.set(CONTAINER_KEYS.NovaPostClient, (c) => {
      if (instances.has(CONTAINER_KEYS.NovaPostClient)) {
        return instances.get(CONTAINER_KEYS.NovaPostClient);
      }
      return new NovaPostClient(
        c.get<HttpClientInterface>(CONTAINER_KEYS.HttpClient),
        c.get<TokenProviderInterface>(CONTAINER_KEYS.TokenProvider),
        c.get<ResponseValidatorInterface>(CONTAINER_KEYS.ResponseValidator),
        c.get<RetryHandlerInterface>(CONTAINER_KEYS.RetryHandler),
        c.get<LoggerInterface>(CONTAINER_KEYS.Logger),
      );
    });

    if (this.bindings.size > 0) {
      // `bind()` is part of the public API for parity with the PHP SDK; advanced wiring
      // beyond `instance()` is intentionally conservative in this first TypeScript release.
    }

    return new Container(factories, instances, this.parameters);
  }

  private initHttpClient(): void {
    if (this.instances.has(CONTAINER_KEYS.HttpClient)) {
      return;
    }

    const useSandbox = Boolean(this.parameters["useSandbox"]);
    const baseUrl = useSandbox ? NOVAPOST_SANDBOX_BASE_URL : NOVAPOST_PRODUCTION_BASE_URL;

    const config = (this.parameters["config"] ?? {}) as {
      fetchInit?: RequestInit;
      fetchFn?: typeof fetch;
    };

    this.instances.set(
      CONTAINER_KEYS.HttpClient,
      new FetchHttpClient({
        baseUrl,
        fetchFn: config.fetchFn,
        defaultInit: config.fetchInit,
      }),
    );
  }
}
