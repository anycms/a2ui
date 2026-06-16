import { computed, defineComponent, h, provide, type PropType } from 'vue';
import { basicCatalog, type Catalog, type SurfaceModel } from '@anycms/a2ui-core';
import { A2uiNode, SURFACE_INJECTION_KEY, type SurfaceContextValue, type VueComponentRegistry } from './adapter';
import { basicVueComponents } from './registry';

export interface A2uiSurfaceProps {
  surface: SurfaceModel;
  catalog?: Catalog;
  registry?: VueComponentRegistry;
}

/**
 * Framework entry point (renderer_guide.md §Surface). Renders the `root`
 * component of a surface. Structural changes (component add/remove/type-change)
 * are handled reactively inside each `A2uiNode`; the surface does not
 * force-rerender the tree — it only provides the surface/catalog/registry.
 *
 * The provided value is a `computed`, so swapping `registry`/`catalog` (e.g. a
 * renderer toggle) re-provides and descendants re-evaluate.
 */
export const A2uiSurface = defineComponent({
  name: 'A2uiSurface',
  props: {
    surface: { type: Object as PropType<SurfaceModel>, required: true },
    catalog: { type: Object as PropType<Catalog>, default: undefined },
    registry: { type: [Object, Map] as unknown as PropType<VueComponentRegistry>, default: undefined },
  },
  setup(props) {
    const value = computed<SurfaceContextValue>(() => ({
      surface: props.surface,
      catalog: props.catalog ?? basicCatalog,
      registry: props.registry ?? basicVueComponents,
    }));
    provide(SURFACE_INJECTION_KEY, value);
    return () =>
      h('div', { class: 'a2ui-surface' }, [h(A2uiNode, { id: 'root', basePath: '' })]);
  },
});
