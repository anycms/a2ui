import { Component, computed, inject, input } from '@angular/core';
import { basicCatalog, type Catalog, type SurfaceModel } from '@anycms/a2ui-core';
import { A2uiNodeComponent } from './a2ui-node.component';
import { A2UI_SURFACE, type SurfaceContextValue } from './tokens';
import { basicAngularComponents } from '../registry';
import type { AngularComponentRegistry } from './types';

/**
 * Framework entry point (renderer_guide.md §Surface). Renders the `root`
 * component of a surface and provides the surface/catalog/registry to the tree.
 * Structural changes (component add/remove/type-change) are handled reactively
 * inside each `A2uiNode`; the surface does not force-rerender the tree.
 *
 * The provided value is a `computed` signal, so swapping `registry`/`catalog`
 * (e.g. a renderer toggle) re-provides and descendants re-evaluate.
 */
@Component({
  selector: 'a2ui-surface',
  template: `
    <div class="a2ui-surface">
      <a2ui-node [id]="rootId" [basePath]="''" />
    </div>
  `,
  imports: [A2uiNodeComponent],
  providers: [
    // Provide the live surface context as a signal so children stay reactive
    // when inputs change. `useFactory` + `inject` reads the host component.
    { provide: A2UI_SURFACE, useFactory: (): unknown => inject(A2uiSurfaceComponent).surfaceCtx },
  ],
})
export class A2uiSurfaceComponent {
  readonly surface = input.required<SurfaceModel>();
  readonly catalog = input<Catalog>();
  readonly registry = input<AngularComponentRegistry>();

  readonly rootId = 'root';

  readonly surfaceCtx = computed<SurfaceContextValue>(() => ({
    surface: this.surface(),
    catalog: this.catalog() ?? basicCatalog,
    registry: this.registry() ?? basicAngularComponents,
  }));
}
