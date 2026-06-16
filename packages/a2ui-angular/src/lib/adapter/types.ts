import type { ComponentBinder, ComponentContext } from '@anycms/a2ui-core';
import type { Type } from '@angular/core';

/**
 * The inputs every Angular View receives. A View implements these as signal
 * inputs (`input<P>()` / `input<ComponentContext>()`) — the Angular analogue
 * of `ComponentViewProps` in the React/Vue adapters.
 */
export interface ComponentViewProps<P> {
  props: P;
  ctx: ComponentContext;
}

/** A standalone Angular component used as an A2UI View. */
export type AngularView<P = unknown> = Type<unknown>;

/** Registry entry: a binder paired with its View component. */
export interface AngularRegistryEntry<P = unknown> {
  readonly binder: ComponentBinder<P>;
  readonly view: AngularView<P>;
}

/** Basic-catalog component-type name -> `{ binder, view }`. */
export type AngularComponentRegistry = ReadonlyMap<string, AngularRegistryEntry>;

/**
 * Pair an A2UI binder with an Angular View into a registry entry — the Angular
 * analogue of `createReactComponent` / `createVueComponent`. Unlike those, the
 * binding itself is handled once, centrally, in {@link A2uiBoundComponent}; this
 * helper just records the pairing so the registry stays a flat `Map`.
 */
export function createAngularComponent<P>(
  binder: ComponentBinder<P>,
  view: AngularView<P>,
): AngularRegistryEntry<P> {
  return { binder, view };
}
