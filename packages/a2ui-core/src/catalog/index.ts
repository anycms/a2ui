import type { ComponentBinder } from '../binder';
import { FunctionRegistry } from '../functions';

export interface CatalogOptions {
  readonly id: string;
  readonly components: ReadonlyArray<ComponentBinder<unknown>>;
  readonly functions?: FunctionRegistry;
  readonly themeSchema?: unknown;
  readonly instructions?: string;
}

/**
 * A catalog groups component binders and function implementations, identified
 * by a unique URI (renderer_guide.md §4). Catalogs are composable: a custom
 * catalog can spread in the Basic Catalog's components and add its own.
 */
export class Catalog {
  readonly id: string;
  readonly components: ReadonlyMap<string, ComponentBinder<unknown>>;
  readonly functions: FunctionRegistry;
  readonly themeSchema?: unknown;
  readonly instructions?: string;

  constructor(opts: CatalogOptions) {
    this.id = opts.id;
    this.components = new Map(opts.components.map((c) => [c.name, c]));
    this.functions = opts.functions ?? new FunctionRegistry();
    this.themeSchema = opts.themeSchema;
    this.instructions = opts.instructions;
  }

  getComponent(name: string): ComponentBinder<unknown> | undefined {
    return this.components.get(name);
  }
}
