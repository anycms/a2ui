import { describe, it, expect } from 'vitest';
import { dateTimeInputBinder, basicCatalogId } from '@anycms/a2ui-core';
import { setup, mount } from '../test-utils';
import { createDomComponent } from '../adapter';
import { dateTimeInputView } from './datetime';

describe('DateTimeInput (dom)', () => {
  it('uses datetime-local type and writes back on change', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { when: '' } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'DateTimeInput', enableDate: true, enableTime: true, value: { path: '/when' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { DateTimeInput: createDomComponent(dateTimeInputBinder, dateTimeInputView) });

    const el = host.querySelector<HTMLInputElement>('input.a2ui-leaf')!;
    expect(el).toBeTruthy();
    expect(el.type).toBe('datetime-local');
    expect(el.style.margin).toBe('8px');

    el.value = '2024-01-02T03:04';
    el.dispatchEvent(new Event('change'));
    expect(surface.dataModel.get('/when')).toBe('2024-01-02T03:04');
  });

  it('switches native type when only date or only time is enabled', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { d: '', t: '' } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: ['date', 'time'] },
            { id: 'date', component: 'DateTimeInput', enableDate: true, enableTime: false, value: { path: '/d' } },
            { id: 'time', component: 'DateTimeInput', enableDate: false, enableTime: true, value: { path: '/t' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { DateTimeInput: createDomComponent(dateTimeInputBinder, dateTimeInputView) });

    const inputs = host.querySelectorAll<HTMLInputElement>('input.a2ui-leaf');
    expect(inputs).toHaveLength(2);
    const types = Array.from(inputs).map((i) => i.type).sort();
    expect(types).toEqual(['date', 'time']);
  });
});
