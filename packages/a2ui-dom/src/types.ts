import type { ComponentContext, ChildNodeRef } from '@anycms/a2ui-core';

/**
 * A mounted DOM node — the output of a {@link DomView} factory and the unit of
 * reconciliation. The instance PERSISTS across prop updates, so the element
 * identity, input focus, and closure-local UI state (e.g. Tabs' selected index)
 * all survive data-driven re-renders.
 */
export interface DomNodeMount {
  /**
   * The root element of this mount. Slot-managed mounts (from `mountChild`)
   * implement this as a getter returning the element currently occupying their
   * DOM slot; view-owned mounts return a stable element.
   */
  readonly element: HTMLElement;
  /** Apply new resolved props by MUTATING the existing element in place. */
  update(props: unknown): void;
  /** Remove listeners and dispose child mounts. Does NOT remove the element from the DOM. */
  dispose(): void;
}

/**
 * Passed to every {@link DomView.create}. `buildChild(ref)` mounts a child
 * component (or a placeholder if not yet defined) and returns its mount; the
 * caller owns the returned mount's lifecycle.
 */
export interface DomViewContext {
  readonly ctx: ComponentContext;
  /** Mount a child by id+basePath. Re-mounts in place when `onCreated` fires. */
  buildChild(ref: ChildNodeRef): DomNodeMount;
}

/**
 * A DOM View factory. `create` is called ONCE on the first `propsStream` emit
 * (which fires synchronously on subscribe). It builds the element, applies
 * initial props, and wires DOM event listeners (closing over the stable `ctx`).
 */
export interface DomView<P> {
  create(props: P, viewCtx: DomViewContext): DomNodeMount;
}

/**
 * The public type of a registered component: given a `ComponentContext` and a
 * `buildChild` (which closes over the registry + catalog), return a bound
 * mount. Produced by {@link createDomComponent}. `buildChild` is threaded down
 * so mounting recurses without any module-global state.
 */
export type DomComponent = (
  ctx: ComponentContext,
  buildChild: (ref: ChildNodeRef) => DomNodeMount,
) => DomNodeMount;

/** Registry: Basic Catalog component-type name -> {@link DomComponent}. */
export type DomComponentRegistry = ReadonlyMap<string, DomComponent>;
