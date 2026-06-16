import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {
  MessageProcessor,
  basicCatalog,
  type A2uiMessage,
  type SurfaceModel,
} from '@anycms/a2ui-core';
// Import the AOT-compiled components from the built package (dist), not the
// source: vitest's esbuild JIT transform doesn't register signal `input()`
// fields as component inputs, so we test against the ng-packagr AOT artifact.
import { A2uiSurfaceComponent, basicAngularComponents } from '@anycms/a2ui-angular';
import type { AngularRegistryEntry } from '@anycms/a2ui-angular';

let envReady = false;
function ensureEnv(): void {
  if (envReady) return;
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  envReady = true;
}

/** Process a batch of A2UI messages into a MessageProcessor (jsdom-friendly). */
export function setup(messages: A2uiMessage[]): MessageProcessor {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

export type SurfaceFixture = ReturnType<typeof TestBed.createComponent<A2uiSurfaceComponent>>;

export interface AngularMount {
  host: HTMLElement;
  fixture: SurfaceFixture;
  unmount(): void;
}

/**
 * Mount a surface via TestBed. `extra` entries are merged onto the default
 * registry so individual component tests can exercise their own View without
 * touching the shared registry (mirrors the Vue/React test-utils `mount`).
 */
export function mount(surface: SurfaceModel, extra?: Record<string, AngularRegistryEntry>): AngularMount {
  ensureEnv();
  const registry: Map<string, AngularRegistryEntry> = new Map(basicAngularComponents);
  if (extra) for (const [type, entry] of Object.entries(extra)) registry.set(type, entry);
  // vitest doesn't run Angular's auto-reset-between-tests, so reset explicitly
  // before each configure (otherwise "module already instantiated" errors).
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(A2uiSurfaceComponent);
  fixture.componentRef.setInput('surface', surface);
  fixture.componentRef.setInput('registry', registry);
  fixture.detectChanges();
  return { host: fixture.nativeElement as HTMLElement, fixture, unmount: () => fixture.destroy() };
}

/** Flush a zoneless change-detection cycle: tick, await stable, tick. */
export async function stable(fixture: SurfaceFixture): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
