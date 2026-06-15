import { describe, it, expect } from 'vitest';
import { cardBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { cardView } from './card';

// jsdom normalizes `#ccc` to `rgb(204, 204, 204)`.
const CCC = 'rgb(204, 204, 204)';

describe('Card (dom)', () => {
  it('renders the card frame with its single child', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            // `child` is a string ComponentId reference (resolveChild).
            { id: 'root', component: 'Card', child: 'c' },
            { id: 'c', component: 'Text', text: 'Inside' },
          ],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Card: createDomComponent(cardBinder, cardView),
    });

    const card = host.querySelector<HTMLElement>('.a2ui-leaf');
    expect(card).toBeTruthy();
    expect(card!.style.margin).toBe('8px');
    expect(card!.style.border).toBe(`1px solid ${CCC}`);
    expect(card!.style.borderRadius).toBe('8px');
    expect(card!.style.padding).toBe('12px');
    expect(card!.textContent).toContain('Inside');
  });

  it('keeps the child and updates it in place when data changes', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { t: 'first' } },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Card', child: 'c' },
            { id: 'c', component: 'Text', text: { path: '/t' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Card: createDomComponent(cardBinder, cardView),
    });

    const card = host.querySelector<HTMLElement>('.a2ui-leaf')!;
    expect(card.textContent).toContain('first');

    // Same child id → in-place self-update, no re-mount.
    const childElBefore = card.querySelector<HTMLElement>('.a2ui-leaf');
    surface.dataModel.set('/t', 'second');
    expect(card.textContent).toContain('second');
    expect(card.textContent).not.toContain('first');
    const childElAfter = card.querySelector<HTMLElement>('.a2ui-leaf');
    expect(childElAfter).toBe(childElBefore);
  });

  it('disposes the child when the card is removed', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: ['card'] },
            { id: 'card', component: 'Card', child: 'c' },
            { id: 'c', component: 'Text', text: 'Inside' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Card: createDomComponent(cardBinder, cardView),
    });

    expect(host.textContent).toContain('Inside');
    // Removing the Card triggers its slot's dispose → card disposes its child.
    surface.componentsModel.remove('card');
    expect(host.textContent).not.toContain('Inside');
  });
});
