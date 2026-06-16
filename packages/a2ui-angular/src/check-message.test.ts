import { describe, it, expect } from 'vitest';
import { textFieldBinder, basicCatalogId } from '@anycms/a2ui-core';
import { setup, mount, stable } from './test-utils';
import { createAngularComponent, TextFieldViewComponent } from '@anycms/a2ui-angular';

// Register the TextField View through the same entry the registry uses, so
// this test exercises the real binding path (mirrors button.test.ts).
const TextField = createAngularComponent(textFieldBinder, TextFieldViewComponent);

describe('check message (angular)', () => {
  it('renders the first failing check message below the control', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'TextField',
              variant: 'shortText',
              label: 'Name',
              value: '',
              checks: [{ condition: false, message: 'Name is required' }],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface, { TextField });

    await stable(fixture);

    const errorEl = host.querySelector<HTMLElement>('.a2ui-check-error')!;
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toBe('Name is required');
    expect(errorEl.style.color).toBe('rgb(220, 38, 38)');
    expect(errorEl.style.fontSize).toBe('0.8em');
    expect(errorEl.style.marginTop).toBe('2px');
    unmount();
  });

  it('does not render an error element when checks pass', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'TextField',
              variant: 'shortText',
              label: 'Name',
              value: 'ok',
              checks: [{ condition: true, message: 'Name is required' }],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface, { TextField });

    await stable(fixture);
    expect(host.querySelector('.a2ui-check-error')).toBeNull();
    unmount();
  });
});
