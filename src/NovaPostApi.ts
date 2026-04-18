import { CONTAINER_KEYS } from "./di/containerKeys.js";
import type { Container } from "./di/Container.js";
import { NOVAPOST_PRODUCTION_BASE_URL, NOVAPOST_SANDBOX_BASE_URL } from "./config.js";
import type { HttpClientInterface } from "./http/HttpClientInterface.js";
import { NovaPostClient } from "./http/NovaPostClient.js";
import { Dictionary } from "./resources/Dictionary.js";
import { Division } from "./resources/Division.js";
import { ExchangeRate } from "./resources/ExchangeRate.js";
import { Pickup } from "./resources/Pickup.js";
import { Registry } from "./resources/Registry.js";
import { Shipment } from "./resources/Shipment.js";
import { Subscription } from "./resources/Subscription.js";
import { Webhooks } from "./resources/Webhooks.js";

export class NovaPostApi {
  static readonly PRODUCTION_BASE_URL = NOVAPOST_PRODUCTION_BASE_URL;
  static readonly SANDBOX_BASE_URL = NOVAPOST_SANDBOX_BASE_URL;

  private readonly instances = new Map<string, object>();

  constructor(private readonly container: Container) {}

  dictionary(): Dictionary {
    return this.getResource(Dictionary);
  }

  divisions(): Division {
    return this.getResource(Division);
  }

  shipments(): Shipment {
    return this.getResource(Shipment);
  }

  exchangeRates(): ExchangeRate {
    return this.getResource(ExchangeRate);
  }

  pickups(): Pickup {
    return this.getResource(Pickup);
  }

  subscriptions(): Subscription {
    return this.getResource(Subscription);
  }

  webhooks(): Webhooks {
    return this.getResource(Webhooks);
  }

  registry(): Registry {
    return this.getResource(Registry);
  }

  private getResource<T extends object>(
    Class: new (client: HttpClientInterface) => T,
  ): T {
    const key = Class.name;
    const cached = this.instances.get(key);
    if (cached) {
      return cached as T;
    }

    if (this.container.has(key)) {
      const instance = this.container.get<T>(key);
      this.instances.set(key, instance as object);
      return instance;
    }

    const client = this.container.get<NovaPostClient>(CONTAINER_KEYS.NovaPostClient);
    const instance = new Class(client);
    this.instances.set(key, instance);
    return instance;
  }
}
