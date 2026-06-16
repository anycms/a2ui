import {
  defineComponent,
  h,
  inject,
  markRaw,
  onBeforeUnmount,
  shallowRef,
  type Component,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type VNode,
  type VNodeChild,
} from 'vue';
import {
  ComponentContext,
  type Catalog,
  type ChildNodeRef,
  type ComponentBinder,
  type ComponentBinding,
  type SurfaceModel,
} from '@anycms/a2ui-core';

/** The data every Vue View receives: resolved props, its binding context, and a child builder. */
export interface ComponentViewProps<P> {
  props: P;
  ctx: ComponentContext;
  buildChild: (ref: ChildNodeRef) => VNode;
}

/**
 * A Vue View. Stateless Views are plain render functions; the two stateful Views
 * (`Tabs`, `Modal`) delegate to an internal `defineComponent` so their local UI
 * state survives prop updates. Both shapes are accepted by `h()` and by
 * {@link createVueComponent}.
 */
export type VueView<P> = (vp: ComponentViewProps<P>) => VNodeChild;

/** A bound A2UI component: a Vue component taking `{ ctx }`. */
export type VueComponent = Component;

/** Basic-catalog component-type name -> bound Vue component. */
export type VueComponentRegistry = ReadonlyMap<string, VueComponent>;

export interface SurfaceContextValue {
  surface: SurfaceModel;
  catalog: Catalog;
  registry: VueComponentRegistry;
}

/**
 * Provided as a `ComputedRef` so a consumer that swaps `catalog`/`registry`
 * (e.g. the gallery renderer toggle) re-provides and descendants re-render.
 */
export const SURFACE_INJECTION_KEY: InjectionKey<ComputedRef<SurfaceContextValue>> = Symbol('a2ui-surface');

/** Read the surface context at call time (snapshot of the current provider value). */
export function useSurfaceContext(): SurfaceContextValue {
  const sc = inject(SURFACE_INJECTION_KEY);
  if (!sc) throw new Error('A2UI component rendered outside <A2uiSurface>');
  return sc.value;
}

/** Stable key for a child ref — disambiguates template items by `basePath`. */
export function childKey(ref: ChildNodeRef): string {
  return `${ref.basePath}::${ref.id}`;
}

/** Render a child component by id + basePath (recursive entry from a View). */
export function buildChildNode(ref: ChildNodeRef): VNode {
  return h(A2uiNode, { id: ref.id, basePath: ref.basePath, key: childKey(ref) });
}

/**
 * Recursive rendering unit: looks up a component by id in the surface's flat
 * map and renders its Vue binding with a context scoped to `basePath`. Mirrors
 * `A2uiNode` in packages/a2ui-react/src/adapter.tsx.
 *
 * Unlike the React surface (which force-renders the whole tree on a structural
 * change), each Vue node self-subscribes to `onCreated`/`onDeleted` and
 * re-evaluates only its own slot — so a type-change rebuilds the binding and a
 * late-arriving child mounts, without touching siblings.
 */
export const A2uiNode = defineComponent({
  name: 'A2uiNode',
  props: {
    id: { type: String as PropType<string>, required: true },
    basePath: { type: String as PropType<string>, default: '' },
  },
  setup(props) {
    const sc = inject(SURFACE_INJECTION_KEY);
    if (!sc) throw new Error('A2UI node rendered outside <A2uiSurface>');

    const tick = shallowRef(0);
    const { surface } = sc.value;
    const c1 = surface.componentsModel.onCreated.subscribe(() => {
      tick.value++;
    });
    const c2 = surface.componentsModel.onDeleted.subscribe(() => {
      tick.value++;
    });
    onBeforeUnmount(() => {
      c1.unsubscribe();
      c2.unsubscribe();
    });

    return () => {
      // track structural changes so this slot re-evaluates on add/remove/type-change
      void tick.value;
      const { surface: sf, catalog, registry } = sc.value;
      const component = sf.componentsModel.get(props.id);
      if (!component) return null; // progressive rendering: not defined yet
      const Comp = registry.get(component.type);
      if (!Comp) {
        return h('div', { class: 'a2ui-unknown' }, `Unknown component: ${component.type}`);
      }
      const ctx = markRaw(
        new ComponentContext({
          surface: sf,
          componentModel: component,
          basePath: props.basePath,
          invoker: catalog.functions,
        }),
      );
      return h(Comp as Component, { ctx });
    };
  },
});

/**
 * Wrap an A2UI binder + a Vue View into a bound component. Binds on mount,
 * subscribes to the resolved-props stream, and disposes on unmount
 * (renderer_guide.md §5 — the Vue analogue of the React adapter). While the
 * first resolve hasn't fired it renders nothing.
 */
export function createVueComponent<P>(
  binder: ComponentBinder<P>,
  View: VueView<P>,
): VueComponent {
  return defineComponent({
    name: 'A2uiBoundComponent',
    props: {
      ctx: { type: Object as PropType<ComponentContext>, required: true },
    },
    setup(props) {
      const model = shallowRef<P | null>(null);
      const binding: ComponentBinding<P> = binder.bind(props.ctx);
      // `Computed.subscribe` replays the current value synchronously, so the
      // initial render already has props (no flash of empty).
      const sub = binding.propsStream.subscribe((p: P) => {
        model.value = p;
      });
      onBeforeUnmount(() => {
        sub.unsubscribe();
        binding.dispose();
      });

      return () => {
        const m = model.value;
        if (m == null) return null;
        return h(View as unknown as Component, {
          props: m,
          ctx: props.ctx,
          buildChild: buildChildNode,
        } as ComponentViewProps<P>);
      };
    },
  });
}
