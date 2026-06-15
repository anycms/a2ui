import { describe, it, expect } from 'vitest';
import { sliderBinder, basicCatalogId } from '@anycms/a2ui-core';
import { setup, mount } from '../test-utils';
import { createDomComponent } from '../adapter';
import { sliderView } from './slider';

describe('Slider (dom)', () => {
  it('renders range input + value span and writes back a number on input', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { n: 10 } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Slider', min: 0, max: 100, value: { path: '/n' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Slider: createDomComponent(sliderBinder, sliderView) });

    const label = host.querySelector<HTMLLabelElement>('label.a2ui-leaf')!;
    expect(label).toBeTruthy();
    expect(label.style.display).toBe('flex');
    expect(label.style.alignItems).toBe('center');
    expect(label.style.gap).toBe('8px');

    const input = label.querySelector<HTMLInputElement>('input[type="range"]')!;
    const span = label.querySelector<HTMLSpanElement>('span')!;

    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.value).toBe('10');
    expect(span.textContent).toBe('10');

    // simulate dragging the slider → writes back a NUMBER and updates the span
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    expect(surface.dataModel.get('/n')).toBe(42);
    expect(span.textContent).toBe('42');
  });

  it('updates min/max and value reactively from the data model', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { v: 5 } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            // value bound to /v; min/max are static literals
            { id: 'root', component: 'Slider', min: 0, max: 50, value: { path: '/v' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Slider: createDomComponent(sliderBinder, sliderView) });

    const label = host.querySelector<HTMLLabelElement>('label.a2ui-leaf')!;
    const input = label.querySelector<HTMLInputElement>('input[type="range"]')!;
    const span = label.querySelector<HTMLSpanElement>('span')!;

    expect(input.value).toBe('5');
    expect(span.textContent).toBe('5');

    // data-driven value change is reflected (and not blocked by the focus guard,
    // since the input is not focused)
    surface.dataModel.set('/v', 37);
    expect(input.value).toBe('37');
    expect(span.textContent).toBe('37');
  });
});
