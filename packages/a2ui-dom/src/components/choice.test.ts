import { describe, it, expect } from 'vitest';
import { choicePickerBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { choicePickerView } from './choice';

describe('ChoicePicker (dom)', () => {
  it('multipleSelection: checking two boxes writes a 2-element array', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { sel: [] },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'ChoicePicker',
              variant: 'multipleSelection',
              value: { path: '/sel' },
              options: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
                { label: 'C', value: 'c' },
              ],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      ChoicePicker: createDomComponent(choicePickerBinder, choicePickerView),
    });

    const inputs = host.querySelectorAll<HTMLInputElement>('.a2ui-leaf input');
    expect(inputs.length).toBe(3);
    expect(inputs[0].type).toBe('checkbox');

    // Initially none checked.
    inputs.forEach((i) => expect(i.checked).toBe(false));

    // Check A, then B.
    inputs[0].checked = true;
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    inputs[1].checked = true;
    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));

    const sel = surface.dataModel.get('/sel');
    expect(Array.isArray(sel)).toBe(true);
    expect((sel as string[]).sort()).toEqual(['a', 'b']);
  });

  it('mutuallyExclusive: selecting sets a single value (radio inputs)', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { sel: '' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'ChoicePicker',
              variant: 'mutuallyExclusive',
              value: { path: '/sel' },
              options: [
                { label: 'One', value: '1' },
                { label: 'Two', value: '2' },
              ],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      ChoicePicker: createDomComponent(choicePickerBinder, choicePickerView),
    });

    const inputs = host.querySelectorAll<HTMLInputElement>('.a2ui-leaf input');
    expect(inputs[0].type).toBe('radio');
    expect(inputs[1].type).toBe('radio');

    inputs[1].checked = true;
    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));

    // For mutuallyExclusive the handler writes back a single string value.
    expect(surface.dataModel.get('/sel')).toBe('2');
  });

  it('refreshes input.checked from a tracked value change without rebuilding labels', () => {
    // `value` is resolved via resolveDynamicValue, so changing it re-emits the
    // propsStream and `update` refreshes each checkbox in place.
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { sel: [] },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'ChoicePicker',
              variant: 'multipleSelection',
              value: { path: '/sel' },
              options: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
                { label: 'C', value: 'c' },
              ],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      ChoicePicker: createDomComponent(choicePickerBinder, choicePickerView),
    });

    let inputs = host.querySelectorAll<HTMLInputElement>('.a2ui-leaf input');
    expect(inputs.length).toBe(3);
    inputs.forEach((i) => expect(i.checked).toBe(false));

    // Drive a value change externally.
    surface.dataModel.set('/sel', ['a', 'c']);

    // Same 3 inputs (not rebuilt), now a & c checked.
    inputs = host.querySelectorAll<HTMLInputElement>('.a2ui-leaf input');
    expect(inputs.length).toBe(3);
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);
    expect(inputs[2].checked).toBe(true);
  });

  it('applies chips gap vs default gap based on displayStyle', () => {
    const mk = (displayStyle: string) =>
      setup([
        { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
        {
          version: 'v1.0',
          updateComponents: {
            surfaceId: 's',
            components: [
              {
                id: 'root',
                component: 'ChoicePicker',
                variant: 'multipleSelection',
                value: [],
                displayStyle,
                options: [{ label: 'A', value: 'a' }],
              },
            ],
          },
        },
      ]);

    const chips = mk('chips').model.get('s')!;
    const { host: chipsHost } = mount(chips, {
      ChoicePicker: createDomComponent(choicePickerBinder, choicePickerView),
    });
    expect(chipsHost.querySelector<HTMLElement>('.a2ui-leaf')!.style.gap).toBe('6px');

    const def = mk('checkbox').model.get('s')!;
    const { host: defHost } = mount(def, {
      ChoicePicker: createDomComponent(choicePickerBinder, choicePickerView),
    });
    expect(defHost.querySelector<HTMLElement>('.a2ui-leaf')!.style.gap).toBe('2px');
  });
});
