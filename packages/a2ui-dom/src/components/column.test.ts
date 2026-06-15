import { describe, it, expect } from 'vitest';
import { basicCatalogId, columnBinder } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { columnView } from './column';

describe('Column (dom)', () => {
  it('renders static children in order with flex styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Column', children: ['a', 'b'] },
            { id: 'a', component: 'Text', text: 'Alpha' },
            { id: 'b', component: 'Text', text: 'Beta' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Column: createDomComponent(columnBinder, columnView) });

    const column = host.querySelector<HTMLElement>('.a2ui-column');
    expect(column).toBeTruthy();
    expect(column!.style.display).toBe('flex');
    expect(column!.style.flexDirection).toBe('column');
    expect(column!.style.justifyContent).toBe('flex-start');
    expect(column!.style.alignItems).toBe('flex-start');
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).toContain('Beta');
    // order preserved
    expect(column!.children.length).toBe(2);
  });

  it('reconciles template children when the list changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { items: [{ id: 'x' }, { id: 'y' }] } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Column', children: { componentId: 'item', path: '/items' } },
            { id: 'item', component: 'Text', text: { path: 'id' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Column: createDomComponent(columnBinder, columnView) });

    expect(host.textContent).toContain('x');
    expect(host.textContent).toContain('y');
    const column = host.querySelector<HTMLElement>('.a2ui-column')!;
    expect(column.children.length).toBe(2);

    // shrink the list — the second item must be disposed and removed
    surface.dataModel.set('/items', [{ id: 'z' }]);
    expect(host.textContent).toContain('z');
    expect(host.textContent).not.toContain('x');
    expect(host.textContent).not.toContain('y');
    expect(column.children.length).toBe(1);
  });

  it('progressively renders a child that arrives after the parent', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Column', children: ['late'] }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Column: createDomComponent(columnBinder, columnView) });

    // child not yet defined → placeholder occupies the slot
    const column = host.querySelector<HTMLElement>('.a2ui-column')!;
    expect(column.children.length).toBe(1);
    expect((column.firstChild as HTMLElement).className).toContain('a2ui-pending');

    // now define the child → slot swaps to the real element in place
    mp.processMessages([
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'late', component: 'Text', text: 'Arrived' }] } },
    ]);
    expect(host.textContent).toContain('Arrived');
    expect((column.firstChild as HTMLElement).className).toContain('a2ui-leaf');
  });
});
