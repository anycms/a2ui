import {
  resolveDynamicValue,
  subscribeDynamicValue,
  type DynamicValueContext,
  type FunctionInvoker,
} from '../dynamic-value';
import { resolvePointer, pointerFromTokens } from '../json-pointer';
import type { DataModel } from '../datamodel';
import type { Listener, Subscription } from '../reactive';
import type { SurfaceModel, SurfaceComponentsModel, ComponentModel } from '../components';

/**
 * A scoped window into the data model (renderer_guide.md §DataContext). Holds
 * a base path; relative pointers resolve against it. Created per template
 * iteration item via `nested()`.
 */
export class DataContext implements DynamicValueContext {
  constructor(
    readonly dataModel: DataModel,
    readonly path: string,
    readonly invoker: FunctionInvoker,
  ) {}

  resolveDynamicValue<V>(v: unknown): V {
    return resolveDynamicValue(v, this) as V;
  }

  subscribeDynamicValue<V>(v: unknown, cb: Listener<V>): Subscription {
    return subscribeDynamicValue(v, this, cb as Listener<unknown>);
  }

  /** Create a child scope at `relativePath` under the current path. */
  nested(relativePath: string): DataContext {
    return new DataContext(
      this.dataModel,
      pointerFromTokens(resolvePointer(relativePath, this.path)),
      this.invoker,
    );
  }

  /** Write back through the current scope (two-way binding). */
  set(path: string, value: unknown): void {
    this.dataModel.set(pointerFromTokens(resolvePointer(path, this.path)), value);
  }
}

/**
 * Transient object created per render, pairing a component's config with a
 * scoped DataContext (renderer_guide.md §ComponentContext). Exposes the
 * `surfaceComponents` escape hatch and `dispatchAction`.
 */
export class ComponentContext implements DynamicValueContext {
  readonly surface: SurfaceModel;
  readonly componentModel: ComponentModel;
  readonly dataContext: DataContext;
  readonly surfaceComponents: SurfaceComponentsModel;

  constructor(opts: {
    surface: SurfaceModel;
    componentModel: ComponentModel;
    basePath?: string;
    invoker: FunctionInvoker;
  }) {
    this.surface = opts.surface;
    this.componentModel = opts.componentModel;
    this.dataContext = new DataContext(opts.surface.dataModel, opts.basePath ?? '', opts.invoker);
    this.surfaceComponents = opts.surface.componentsModel;
  }

  get dataModel(): DataModel {
    return this.dataContext.dataModel;
  }
  get path(): string {
    return this.dataContext.path;
  }
  get invoker(): FunctionInvoker {
    return this.dataContext.invoker;
  }

  resolveDynamicValue<V>(v: unknown): V {
    return this.dataContext.resolveDynamicValue<V>(v);
  }

  subscribeDynamicValue<V>(v: unknown, cb: Listener<V>): Subscription {
    return this.dataContext.subscribeDynamicValue<V>(v, cb);
  }

  /** Create a child DataContext at `relativePath` under the current scope. */
  nested(relativePath: string): DataContext {
    return this.dataContext.nested(relativePath);
  }

  /** Write back through the current scope (two-way binding). */
  set(path: string, value: unknown): void {
    this.dataContext.set(path, value);
  }

  dispatchAction(payload: {
    name: string;
    context?: Record<string, unknown>;
    wantResponse?: boolean;
    actionId?: string;
  }): void {
    this.surface.dispatchAction(payload, this.componentModel.id);
  }
}
