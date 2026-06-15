import { describe, it, expect } from 'vitest';
import { basicCatalogId, listBinder } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { listView } from './list';

describe('List (dom)', () => {
  it('renders static children in order with vertical flex styles by default', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'List', direction: 'vertical', children: ['a', 'b'] },
            { id: 'a', component: 'Text', text: 'Alpha' },
            { id: 'b', component: 'Text', text: 'Beta' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { List: createDomComponent(listBinder, listView) });

    const list = host.querySelector<HTMLElement>('.a2ui-list');
    expect(list).toBeTruthy();
    expect(list!.style.display).toBe('flex');
    expect(list!.style.flexDirection).toBe('column');
    expect(list!.style.overflowX).toBe('hidden');
    expect(list!.style.overflowY).toBe('auto');
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).toContain('Beta');
    expect(list!.children.length).toBe(2);
  });

  it('flips flexDirection and overflow axes when direction is horizontal', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'List', direction: 'horizontal', children: ['a'] },
            { id: 'a', component: 'Text', text: 'Alpha' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { List: createDomComponent(listBinder, listView) });

    const list = host.querySelector<HTMLElement>('.a2ui-list')!;
    expect(list.style.flexDirection).toBe('row');
    expect(list.style.overflowX).toBe('auto');
    expect(list.style.overflowY).toBe('hidden');
  });

  it('reconciles template children when the list changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { items: [{ id: 'x' }, { id: 'y' }, { id: 'w' }] } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'List', direction: 'vertical', children: { componentId: 'item', path: '/items' } },
            { id: 'item', component: 'Text', text: { path: 'id' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { List: createDomComponent(listBinder, listView) });

    expect(host.textContent).toContain('x');
    expect(host.textContent).toContain('y');
    expect(host.textContent).toContain('w');
    const list = host.querySelector<HTMLElement>('.a2ui-list')!;
    expect(list.children.length).toBe(3);

    // shrink the list — extras must be disposed and removed
    surface.dataModel.set('/items', [{ id: 'z' }]);
    expect(host.textContent).toContain('z');
    expect(host.textContent).not.toContain('x');
    expect(host.textContent).not.toContain('y');
    expect(host.textContent).not.toContain('w');
    expect(list.children.length).toBe(1);
  });

  it('progressively renders a child that arrives after the parent', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'List', direction: 'vertical', children: ['late'] }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { List: createDomComponent(listBinder, listView) });

    // child not yet defined → placeholder occupies the slot
    const list = host.querySelector<HTMLElement>('.a2ui-list')!;
    expect(list.children.length).toBe(1);
    expect((list.firstChild as HTMLElement).className).toContain('a2ui-pending');

    // now define the child → slot swaps to the real element in place
    mp.processMessages([
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'late', component: 'Text', text: 'Arrived' }] } },
    ]);
    expect(host.textContent).toContain('Arrived');
    expect((list.firstChild as HTMLElement).className).toContain('a2ui-leaf');
  });
});
