import { describe, it, expect } from 'vitest';
import { textFieldBinder, basicCatalogId } from '@anycms/a2ui-core';
import { createDomComponent } from '../adapter';
import { setup, mount } from '../test-utils';
import { textFieldView } from './textfield';

describe('TextField (dom)', () => {
  it('renders an input bound to a path and writes back on input', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { name: 'Alice' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'TextField', value: { path: '/name' }, label: 'Name' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });

    const input = host.querySelector<HTMLInputElement>('.a2ui-leaf input');
    expect(input).toBeTruthy();
    expect(input!.type).toBe('text');
    expect(input!.value).toBe('Alice');
    expect(input!.placeholder).toBe('Name');

    // External set while NOT focused updates the field (value is a tracked prop).
    surface.dataModel.set('/name', 'Bob');
    expect(input!.value).toBe('Bob');
  });

  it('preserves focus and writes back when the user types (focus guard)', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { name: '' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'TextField', value: { path: '/name' }, label: 'Name' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });

    const input = host.querySelector<HTMLInputElement>('.a2ui-leaf input')!;
    input.focus();
    expect(document.activeElement).toBe(input);

    // Simulate the user typing 'A'. The oninput handler writes back to /name,
    // which is a tracked prop, so an update fires with value 'A'. Because the
    // control IS focused AND its value already equals 'A', the guard leaves the
    // DOM value untouched and focus is retained.
    input.value = 'A';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('A');
    expect(surface.dataModel.get('/name')).toBe('A');
  });

  it('renders <textarea> for longText variant and <input> otherwise', () => {
    // longText -> textarea
    const mp1 = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's1', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's1',
          components: [
            { id: 'root', component: 'TextField', value: 'hi', variant: 'longText', label: 'L' },
          ],
        },
      },
    ]);
    const { host: host1 } = mount(mp1.model.get('s1')!, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });
    const wrapper1 = host1.querySelector<HTMLElement>('.a2ui-leaf')!;
    const textarea = wrapper1.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea!.value).toBe('hi');
    expect(textarea!.placeholder).toBe('L');
    expect(wrapper1.querySelector('input')).toBeNull();
    expect(textarea!.style.minHeight).toBe('80px');

    // number -> input type=number
    const mp2 = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's2', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's2',
          components: [
            { id: 'root', component: 'TextField', value: '5', variant: 'number', label: 'N' },
          ],
        },
      },
    ]);
    const { host: host2 } = mount(mp2.model.get('s2')!, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });
    const input2 = host2.querySelector<HTMLInputElement>('.a2ui-leaf input')!;
    expect(input2.type).toBe('number');
    expect(input2.value).toBe('5');

    // obscured -> password
    const mp3 = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's3', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's3',
          components: [
            { id: 'root', component: 'TextField', value: 'secret', variant: 'obscured' },
          ],
        },
      },
    ]);
    const { host: host3 } = mount(mp3.model.get('s3')!, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });
    const input3 = host3.querySelector<HTMLInputElement>('.a2ui-leaf input')!;
    expect(input3.type).toBe('password');
  });

  it('keeps the wrapper element stable across value updates', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { name: 'first' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'TextField', value: { path: '/name' }, label: 'Name' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });

    const wrapperBefore = host.querySelector<HTMLElement>('.a2ui-leaf')!;
    surface.dataModel.set('/name', 'second');
    const wrapperAfter = host.querySelector<HTMLElement>('.a2ui-leaf')!;
    // Same wrapper identity (the mount's element is readonly/stable).
    expect(wrapperAfter).toBe(wrapperBefore);
    expect(wrapperAfter.querySelector('input')!.value).toBe('second');
  });

  it('shows the first failing check message', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { name: '' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'TextField',
              value: { path: '/name' },
              label: 'Name',
              // a check whose condition resolves to false surfaces its message
              checks: [{ condition: false, message: 'Required' }],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });

    const wrapper = host.querySelector<HTMLElement>('.a2ui-leaf')!;
    const error = wrapper.querySelector<HTMLElement>('.a2ui-check-error')!;
    expect(error).toBeTruthy();
    // The failing message is rendered and the element is shown.
    expect(error.style.display).toBe('block');
    expect(wrapper.textContent).toContain('Required');
    expect(error.textContent).toBe('Required');
    expect(error.style.color).toBe('rgb(220, 38, 38)');
    expect(error.style.fontSize).toBe('0.8em');
    expect(error.style.marginTop).toBe('2px');
  });

  it('hides the check error when all checks pass', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { name: 'ok' },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'TextField',
              value: { path: '/name' },
              label: 'Name',
              checks: [{ condition: true, message: 'Required' }],
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, {
      TextField: createDomComponent(textFieldBinder, textFieldView),
    });

    const wrapper = host.querySelector<HTMLElement>('.a2ui-leaf')!;
    const error = wrapper.querySelector<HTMLElement>('.a2ui-check-error')!;
    expect(error).toBeTruthy();
    // Passing check → error stays hidden and empty.
    expect(error.style.display).toBe('none');
    expect(error.textContent).toBe('');
    expect(wrapper.textContent).not.toContain('Required');
  });
});
