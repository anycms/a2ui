import { MessageProcessor, basicCatalog, type A2uiMessage, type SurfaceModel } from '@anycms/a2ui-core';
import { mountDomSurface, type DomSurfaceHandle } from './surface';
import { basicDomComponents } from './registry';
import type { DomComponent } from './types';

/** Process a batch of A2UI messages into a MessageProcessor (jsdom-friendly). */
export function setup(messages: A2uiMessage[]): MessageProcessor {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

/**
 * Mount a surface into a fresh host element. `extra` component entries are
 * merged onto the default registry so individual component tests can exercise
 * their own view without touching the shared registry.
 */
export function mount(
  surface: SurfaceModel,
  extra?: Record<string, DomComponent>,
): { host: HTMLElement; handle: DomSurfaceHandle } {
  const registry = new Map(basicDomComponents);
  if (extra) for (const [type, comp] of Object.entries(extra)) registry.set(type, comp);
  const host = document.createElement('div');
  document.body.appendChild(host);
  const handle = mountDomSurface(surface, host, { registry });
  return { host, handle };
}
