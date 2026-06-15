import { Computed, type Listener, type Subscription } from '../reactive';
import type { ComponentContext } from '../context';

/**
 * A read-only reactive cell: carries a current value and replays it on
 * subscribe. Both `Signal` and `Computed` satisfy this, so a binding's
 * props stream can be backed by either.
 */
export interface ReadOnlySignal<T> {
  readonly value: T;
  subscribe(listener: Listener<T>): Subscription;
}

/** A reference to a child component to render, with its data scope. */
export interface ChildNodeRef {
  readonly id: string;
  readonly basePath: string;
}

/** The framework-agnostic API of a component (renderer_guide.md §ComponentApi). */
export interface ComponentApi {
  readonly name: string;
  /** Opaque schema (Zod). Used for capability generation, not by the binder. */
  readonly schema: unknown;
}

/** The output of binding a component to its context. */
export interface ComponentBinding<ResolvedProps> {
  /** A reactive stream of fully-resolved, strongly-typed props. */
  readonly propsStream: ReadOnlySignal<ResolvedProps>;
  /** Release all data-model subscriptions backing the stream. */
  dispose(): void;
}

/** Connects a component's raw properties to a resolved-props stream. */
export interface ComponentBinder<ResolvedProps> extends ComponentApi {
  bind(ctx: ComponentContext): ComponentBinding<ResolvedProps>;
}

/**
 * Define a binder from a `resolve` function. `resolve` runs inside a Computed,
 * so any `ctx.resolveDynamicValue({path})` calls register data-model
 * dependencies automatically — when the data changes, the props stream emits
 * a fresh ResolvedProps object (new reference, so declarative renderers like
 * React detect the change).
 */
export function defineBinder<ResolvedProps>(opts: {
  name: string;
  schema: unknown;
  resolve: (ctx: ComponentContext) => ResolvedProps;
}): ComponentBinder<ResolvedProps> {
  const { name, schema, resolve } = opts;
  return {
    name,
    schema,
    bind(ctx: ComponentContext): ComponentBinding<ResolvedProps> {
      const computed = new Computed<ResolvedProps>(() => resolve(ctx));
      return {
        propsStream: computed,
        dispose: () => computed.dispose(),
      };
    },
  };
}

/** Resolve a single `child` (ComponentId) reference. Returns null if absent. */
export function resolveChild(child: unknown, ctx: ComponentContext): ChildNodeRef | null {
  if (typeof child === 'string' && child.length > 0) {
    return { id: child, basePath: ctx.path };
  }
  return null;
}

/** Result of evaluating a single check rule (Checkable components). */
export interface CheckResult {
  readonly valid: boolean;
  readonly message: string;
}

/**
 * Evaluate a `checks` array (common_types CheckRule[]). Each `condition` is a
 * DynamicBoolean resolved against the context; the first failing rule's
 * message is typically surfaced by interactive components, and any failure
 * disables actions (e.g. a Button).
 */
export function resolveChecks(checks: unknown, ctx: ComponentContext): CheckResult[] {
  if (!Array.isArray(checks)) return [];
  return checks.map((rule) => {
    const r = rule as { condition?: unknown; message?: unknown };
    return {
      valid: Boolean(ctx.resolveDynamicValue(r.condition)),
      message: typeof r.message === 'string' ? r.message : '',
    };
  });
}

/**
 * Resolve a `ChildList` (renderer_guide.md §common_types ChildList):
 *  - string[]: static list of child ids, all sharing the current scope.
 *  - { componentId, path }: template — iterate the array at `path`, giving
 *    each item a nested scope (e.g. /users/0, /users/1) for relative binding.
 */
export function resolveChildList(children: unknown, ctx: ComponentContext): ChildNodeRef[] {
  if (Array.isArray(children)) {
    return children.map((id) => ({ id: String(id), basePath: ctx.path }));
  }
  if (children && typeof children === 'object') {
    const tpl = children as { componentId?: string; path?: string };
    if (tpl.componentId && tpl.path) {
      const arr = ctx.resolveDynamicValue<unknown[]>({ path: tpl.path });
      const list = Array.isArray(arr) ? arr : [];
      const base = ctx.nested(tpl.path);
      return list.map((_, i) => ({
        id: tpl.componentId as string,
        basePath: base.nested(`${i}`).path,
      }));
    }
  }
  return [];
}
