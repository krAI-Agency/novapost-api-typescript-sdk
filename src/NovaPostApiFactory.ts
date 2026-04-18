import type { Container } from "./di/Container.js";
import { ContainerBuilder } from "./di/ContainerBuilder.js";
import { NovaPostApi } from "./NovaPostApi.js";

export class NovaPostApiFactory {
  /**
   * Callable entrypoint mirroring the PHP SDK's `NovaPostApiFactory::__invoke()`.
   */
  invoke(
    apiKey: string,
    containerBuilder?: ContainerBuilder,
    useSandbox = false,
  ): NovaPostApi {
    return this.create(apiKey, containerBuilder, useSandbox);
  }

  create(
    apiKey: string,
    containerBuilder?: ContainerBuilder,
    useSandbox = false,
  ): NovaPostApi {
    const builder = containerBuilder ?? new ContainerBuilder();

    const container: Container = builder
      .setParameter("apiKey", apiKey)
      .setParameter("useSandbox", useSandbox)
      .build();

    return new NovaPostApi(container);
  }
}
