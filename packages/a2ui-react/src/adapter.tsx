import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  ComponentContext,
  type Catalog,
  type ChildNodeRef,
  type ComponentBinder,
  type ComponentBinding,
  type SurfaceModel,
} from '@anycms/a2ui-core';

export interface ComponentViewProps<P> {
  props: P;
  ctx: ComponentContext;
  buildChild: (ref: ChildNodeRef) => ReactNode;
}

export type ReactComponentRegistry = ReadonlyMap<string, ComponentType<{ ctx: ComponentContext }>>;

export interface SurfaceContextValue {
  surface: SurfaceModel;
  catalog: Catalog;
  registry: ReactComponentRegistry;
}

export const SurfaceContext = createContext<SurfaceContextValue | null>(null);

export function useSurfaceContext(): SurfaceContextValue {
  const v = useContext(SurfaceContext);
  if (!v) throw new Error('A2UI component rendered outside <A2uiSurface>');
  return v;
}

/** Render a child component by id + basePath (recursive entry from a View). */
export function buildChildNode(ref: ChildNodeRef): ReactNode {
  return <A2uiNode id={ref.id} basePath={ref.basePath} />;
}

/**
 * Recursive rendering unit: looks up a component by id in the surface's flat
 * map and renders its React binding with a context scoped to `basePath`.
 */
export function A2uiNode({ id, basePath }: { id: string; basePath: string }): ReactNode {
  const { surface, catalog, registry } = useSurfaceContext();
  const component = surface.componentsModel.get(id);
  if (!component) return null; // progressive rendering: not defined yet
  const Comp = registry.get(component.type);
  if (!Comp) {
    return <div className="a2ui-unknown">Unknown component: {component.type}</div>;
  }
  const ctx = new ComponentContext({
    surface,
    componentModel: component,
    basePath,
    invoker: catalog.functions,
  });
  return <Comp ctx={ctx} />;
}

/**
 * Wrap an A2UI binder + a framework View into a React component. Binds on
 * mount, subscribes to the resolved-props stream, and disposes on unmount
 * (renderer_guide.md §5 React adapter).
 */
export function createReactComponent<P>(
  binder: ComponentBinder<P>,
  View: ComponentType<ComponentViewProps<P>>,
): ComponentType<{ ctx: ComponentContext }> {
  return function A2uiBoundComponent({ ctx }: { ctx: ComponentContext }) {
    const [props, setProps] = useState<P | null>(null);
    const bindingRef = useRef<ComponentBinding<P> | null>(null);

    useEffect(() => {
      const binding = binder.bind(ctx);
      bindingRef.current = binding;
      const sub = binding.propsStream.subscribe((p) => setProps(p));
      return () => {
        sub.unsubscribe();
        binding.dispose();
        bindingRef.current = null;
      };
    }, [ctx, binder]);

    if (props == null) return null;
    return <View props={props} ctx={ctx} buildChild={buildChildNode} />;
  };
}
