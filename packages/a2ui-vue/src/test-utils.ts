import { createApp, h, type App } from 'vue';
import { MessageProcessor, basicCatalog, type A2uiMessage, type SurfaceModel } from '@anycms/a2ui-core';
import { A2uiSurface } from './Surface';
import { basicVueComponents } from './registry';
import type { VueComponent } from './adapter';

/** Process a batch of A2UI messages into a MessageProcessor (jsdom-friendly). */
export function setup(messages: A2uiMessage[]): MessageProcessor {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

export interface VueMount {
  host: HTMLElement;
  unmount(): void;
}

/**
 * Mount a surface into a fresh host element. `extra` component entries are
 * merged onto the default registry so individual component tests can exercise
 * their own view without touching the shared registry.
 */
export function mount(
  surface: SurfaceModel,
  extra?: Record<string, VueComponent>,
): VueMount {
  const registry: Map<string, VueComponent> = new Map(basicVueComponents);
  if (extra) for (const [type, comp] of Object.entries(extra)) registry.set(type, comp);
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app: App = createApp({ render: () => h(A2uiSurface, { surface, registry }) });
  app.mount(host);
  return { host, unmount: () => app.unmount() };
}
