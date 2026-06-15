import { basicCatalog, type Catalog, type SurfaceModel } from '@anycms/a2ui-core';
import { mountChild } from './helpers';
import { basicDomComponents } from './registry';
import type { DomComponentRegistry } from './types';

export interface MountDomSurfaceOptions {
  catalog?: Catalog;
  registry?: DomComponentRegistry;
}

export interface DomSurfaceHandle {
  /** The `.a2ui-surface` root container element. */
  readonly element: HTMLElement;
  /** Unmount the surface: dispose the root mount and remove the container. */
  dispose(): void;
}

/**
 * Mount a {@link SurfaceModel} into a host element. Creates the `.a2ui-surface`
 * root container, mounts the `root` component, and lets each bound node react
 * to its own props stream / lifecycle events — there is no top-level
 * force-rerender (unlike the React `<A2uiSurface>`), which preserves input
 * focus and local UI state across data changes.
 */
export function mountDomSurface(
  surface: SurfaceModel,
  hostEl: HTMLElement,
  opts: MountDomSurfaceOptions = {},
): DomSurfaceHandle {
  const catalog = opts.catalog ?? basicCatalog;
  const registry = opts.registry ?? basicDomComponents;

  const root = document.createElement('div');
  root.className = 'a2ui-surface';

  const rootMount = mountChild(surface, { id: 'root', basePath: '' }, registry, catalog);
  root.appendChild(rootMount.element);
  hostEl.appendChild(root);

  return {
    element: root,
    dispose(): void {
      rootMount.dispose();
      root.remove();
    },
  };
}
