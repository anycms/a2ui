import { InjectionToken, type Signal } from '@angular/core';
import type { Catalog, SurfaceModel } from '@anycms/a2ui-core';
import type { AngularComponentRegistry } from './types';

/** Surface/catalog/registry provided to the rendered tree. */
export interface SurfaceContextValue {
  surface: SurfaceModel;
  catalog: Catalog;
  registry: AngularComponentRegistry;
}

/**
 * Provided as a `Signal<SurfaceContextValue>` (a `computed` on
 * `<a2ui-surface>`), so a consumer that swaps `catalog`/`registry` (e.g. the
 * gallery renderer toggle) re-provides and descendants re-evaluate. Consumers
 * read it inside their own `computed`/template to stay reactive.
 */
export const A2UI_SURFACE = new InjectionToken<Signal<SurfaceContextValue>>('A2UI_SURFACE');
