import { describe, it, expect } from 'vitest';
import { MessageProcessor, basicCatalog, basicCatalogId, type A2uiMessage } from '@anycms/a2ui-core';
import { mountDomSurface } from '../surface';

function setup(messages: A2uiMessage[]): MessageProcessor {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

describe('Row (dom)', () => {
  it('renders static children in order with flex styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: ['a', 'b'] },
            { id: 'a', component: 'Text', text: 'Alpha' },
            { id: 'b', component: 'Text', text: 'Beta' },
          ],
        },
      },
    ]);
    const host = document.createElement('div');
    document.body.appendChild(host);
    mountDomSurface(mp.model.get('s')!, host);

    const row = host.querySelector<HTMLElement>('.a2ui-row');
    expect(row).toBeTruthy();
    expect(row!.style.display).toBe('flex');
    expect(row!.style.flexDirection).toBe('row');
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).toContain('Beta');
    // order preserved
    expect(row!.children.length).toBe(2);
  });

  it('reconciles template children when the list changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { items: [{ id: 'x' }, { id: 'y' }] } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: { componentId: 'item', path: '/items' } },
            { id: 'item', component: 'Text', text: { path: 'id' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const host = document.createElement('div');
    document.body.appendChild(host);
    mountDomSurface(surface, host);

    expect(host.textContent).toContain('x');
    expect(host.textContent).toContain('y');
    const row = host.querySelector<HTMLElement>('.a2ui-row')!;
    expect(row.children.length).toBe(2);

    // shrink the list — the second item must be disposed and removed
    surface.dataModel.set('/items', [{ id: 'z' }]);
    expect(host.textContent).toContain('z');
    expect(host.textContent).not.toContain('x');
    expect(host.textContent).not.toContain('y');
    expect(row.children.length).toBe(1);
  });

  it('progressively renders a child that arrives after the parent', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Row', children: ['late'] }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const host = document.createElement('div');
    document.body.appendChild(host);
    mountDomSurface(surface, host);

    // child not yet defined → placeholder occupies the slot
    const row = host.querySelector<HTMLElement>('.a2ui-row')!;
    expect(row.children.length).toBe(1);
    expect((row.firstChild as HTMLElement).className).toContain('a2ui-pending');

    // now define the child → slot swaps to the real element in place
    mp.processMessages([
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'late', component: 'Text', text: 'Arrived' }] } },
    ]);
    expect(host.textContent).toContain('Arrived');
    expect((row.firstChild as HTMLElement).className).toContain('a2ui-leaf');
  });
});
