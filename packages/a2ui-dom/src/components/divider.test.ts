import { describe, it, expect } from 'vitest';
import { dividerBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { dividerView } from './divider';

// jsdom normalizes `#ccc` to `rgb(204, 204, 204)` in computed cssText.
const CCC = 'rgb(204, 204, 204)';

describe('Divider (dom)', () => {
  it('renders a horizontal rule by default', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Divider' }],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Divider: createDomComponent(dividerBinder, dividerView),
    });

    const hr = host.querySelector<HTMLHRElement>('.a2ui-leaf');
    expect(hr).toBeTruthy();
    expect(hr!.tagName).toBe('HR');
    expect(hr!.style.margin).toBe('8px');
    expect(hr!.style.width).toBe('100%');
    expect(hr!.style.borderTop).toBe(`1px solid ${CCC}`);
  });

  it('renders a vertical rule when axis is vertical', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Divider', axis: 'vertical' }],
        },
      },
    ]);
    const { host } = mount(mp.model.get('s')!, {
      Divider: createDomComponent(dividerBinder, dividerView),
    });

    const hr = host.querySelector<HTMLHRElement>('.a2ui-leaf')!;
    expect(hr.style.width).toBe('1px');
    expect(hr.style.alignSelf).toBe('stretch');
    expect(hr.style.borderLeft).toBe(`1px solid ${CCC}`);
  });

  it('reapplies styles when the divider is swapped (type change → re-mount)', () => {
    // `axis` is a static variant (not data-bound), so exercising the update
    // path requires a fresh mount with the opposite axis.
    const mpH = setup([
      { version: 'v1.0', createSurface: { surfaceId: 'h', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 'h',
          components: [{ id: 'root', component: 'Divider', axis: 'horizontal' }],
        },
      },
    ]);
    const { host: hostH } = mount(mpH.model.get('h')!, {
      Divider: createDomComponent(dividerBinder, dividerView),
    });
    const hrH = hostH.querySelector<HTMLHRElement>('.a2ui-leaf')!;
    expect(hrH.style.width).toBe('100%');
    expect(hrH.style.borderTop).toBe(`1px solid ${CCC}`);

    const mpV = setup([
      { version: 'v1.0', createSurface: { surfaceId: 'v', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 'v',
          components: [{ id: 'root', component: 'Divider', axis: 'vertical' }],
        },
      },
    ]);
    const { host: hostV } = mount(mpV.model.get('v')!, {
      Divider: createDomComponent(dividerBinder, dividerView),
    });
    const hrV = hostV.querySelector<HTMLHRElement>('.a2ui-leaf')!;
    expect(hrV.style.width).toBe('1px');
    expect(hrV.style.alignSelf).toBe('stretch');
    expect(hrV.style.borderLeft).toBe(`1px solid ${CCC}`);
  });
});
