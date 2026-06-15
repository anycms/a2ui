import { describe, it, expect } from 'vitest';
import { MessageProcessor, basicCatalog, basicCatalogId, type A2uiMessage } from '@anycms/a2ui-core';
import { mountDomSurface } from '../surface';

function setup(messages: A2uiMessage[]): MessageProcessor {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

describe('Text (dom)', () => {
  it('renders text content with leaf styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'Hello' }] } },
    ]);
    const host = document.createElement('div');
    document.body.appendChild(host);
    mountDomSurface(mp.model.get('s')!, host);

    const leaf = host.querySelector<HTMLElement>('.a2ui-leaf');
    expect(leaf).toBeTruthy();
    expect(leaf!.textContent).toBe('Hello');
    expect(leaf!.style.margin).toBe('8px');
  });

  it('updates reactively when bound data changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { x: 'old' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: { path: '/x' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const host = document.createElement('div');
    document.body.appendChild(host);
    mountDomSurface(surface, host);

    expect(host.textContent).toContain('old');
    surface.dataModel.set('/x', 'new');
    expect(host.textContent).toContain('new');
    expect(host.textContent).not.toContain('old');
  });
});
