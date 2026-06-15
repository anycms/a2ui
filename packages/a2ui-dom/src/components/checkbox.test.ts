import { describe, it, expect } from 'vitest';
import { checkBoxBinder, basicCatalogId } from '@anycms/a2ui-core';
import { setup, mount } from '../test-utils';
import { createDomComponent } from '../adapter';
import { checkBoxView } from './checkbox';

describe('CheckBox (dom)', () => {
  it('renders checked state and label, writes back on change', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { agree: false } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'CheckBox', label: 'I agree', value: { path: '/agree' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { CheckBox: createDomComponent(checkBoxBinder, checkBoxView) });

    const label = host.querySelector<HTMLLabelElement>('label.a2ui-leaf')!;
    expect(label).toBeTruthy();
    const input = label.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const span = label.querySelector<HTMLSpanElement>('span')!;

    expect(input.checked).toBe(false);
    expect(span.textContent).toBe('I agree');
    expect(label.style.display).toBe('flex');
    expect(label.style.alignItems).toBe('center');
    expect(label.style.gap).toBe('6px');

    // simulate a user toggle → writes back to /agree
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(surface.dataModel.get('/agree')).toBe(true);
  });

  it('updates reactively when the bound value changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { flag: false } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'CheckBox', label: 'Toggle', value: { path: '/flag' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { CheckBox: createDomComponent(checkBoxBinder, checkBoxView) });

    const input = host.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(input.checked).toBe(false);

    surface.dataModel.set('/flag', true);
    expect(input.checked).toBe(true);
  });
});
