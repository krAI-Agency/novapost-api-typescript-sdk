import { ContainerException } from "../exceptions/ContainerException.js";
import type { ContainerKey } from "./containerKeys.js";

type Factory = (container: Container) => unknown;

export class Container {
  private readonly creating = new Set<string>();

  constructor(
    private readonly factories: Map<string, Factory>,
    private readonly instances: Map<string, unknown>,
    private readonly parameters: Record<string, unknown>,
  ) {}

  getParameter<T>(key: string): T {
    return this.parameters[key] as T;
  }

  has(id: string): boolean {
    return this.instances.has(id);
  }

  get<T>(id: ContainerKey | string): T {
    if (this.instances.has(id)) {
      return this.instances.get(id) as T;
    }

    if (this.creating.has(id)) {
      throw ContainerException.circularDependency(id);
    }

    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Cannot resolve dependency for ${id}`);
    }

    this.creating.add(id);
    try {
      const object = factory(this);
      this.instances.set(id, object);
      return object as T;
    } catch (error) {
      throw ContainerException.resolutionFailed(id, error);
    } finally {
      this.creating.delete(id);
    }
  }
}
