import { describe, it, expect } from 'vitest';
import { iconBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { iconView } from './icon';

describe('Icon (dom)', () => {
  it('renders the diamond glyph with leaf styles and title', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Icon', name: 'star' }],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Icon: createDomComponent(iconBinder, iconView),
    });

    const span = host.querySelector<HTMLSpanElement>('.a2ui-leaf');
    expect(span).toBeTruthy();
    expect(span!.tagName).toBe('SPAN');
    expect(span!.textContent).toBe('◆');
    expect(span!.style.margin).toBe('8px');
    expect(span!.style.display).toBe('inline-block');
    expect(span!.style.color).toBe('inherit');
    expect(span!.title).toBe('star');
  });

  it('updates the title when the icon name changes', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { n: 'star' } },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Icon', name: { path: '/n' } }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      Icon: createDomComponent(iconBinder, iconView),
    });

    const span = host.querySelector<HTMLSpanElement>('.a2ui-leaf')!;
    expect(span.title).toBe('star');

    surface.dataModel.set('/n', 'heart');
    expect(span.title).toBe('heart');
    // glyph stays constant across updates
    expect(span.textContent).toBe('◆');
  });
});
