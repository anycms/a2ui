import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { basicCatalog, type Catalog, type SurfaceModel } from '@anycms/a2ui-core';
import { A2uiNode, SurfaceContext, type ReactComponentRegistry } from './adapter';
import { basicReactComponents } from './registry';

export interface A2uiSurfaceProps {
  surface: SurfaceModel;
  catalog?: Catalog;
  registry?: ReactComponentRegistry;
  /** Extra classes for the root `.a2ui-surface` node (e.g. a theme-scope hook). */
  className?: string;
  /** Inline style for the root node — handy as a token container for theming:
   *  `style={{ '--color-primary': '#x' } as CSSProperties}`. */
  style?: CSSProperties;
}

/**
 * Framework entry point (renderer_guide.md §Surface). Renders the `root`
 * component of a surface, and re-renders the tree when components are added or
 * removed. Property/data changes are handled reactively inside each bound node.
 */
export function A2uiSurface({
  surface,
  catalog = basicCatalog,
  registry = basicReactComponents,
  className,
  style,
}: A2uiSurfaceProps): ReactNode {
  const [, force] = useState(0);

  useEffect(() => {
    const c1 = surface.componentsModel.onCreated.subscribe(() => force((v) => v + 1));
    const c2 = surface.componentsModel.onDeleted.subscribe(() => force((v) => v + 1));
    return () => {
      c1.unsubscribe();
      c2.unsubscribe();
    };
  }, [surface]);

  return (
    <SurfaceContext.Provider value={{ surface, catalog, registry }}>
      <div
        className={className ? `a2ui-surface ${className}` : 'a2ui-surface'}
        style={style}
      >
        <A2uiNode id="root" basePath="" />
      </div>
    </SurfaceContext.Provider>
  );
}
