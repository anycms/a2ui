import { describe, it, expect } from 'vitest';
import { buttonBinder, basicCatalogId, type A2uiClientAction } from '@anycms/a2ui-core';
import { setup, mount } from '../test-utils';
import { createDomComponent } from '../adapter';
import { buttonView } from './button';

describe('Button (dom)', () => {
  it('dispatches the bound action on click and reflects enabled styles', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Button',
              variant: 'primary',
              action: { event: { name: 'submit', context: { source: 'ui' } } },
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Button: createDomComponent(buttonBinder, buttonView) });

    const btn = host.querySelector<HTMLButtonElement>('button.a2ui-leaf')!;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
    expect(btn.style.cursor).toBe('pointer');
    expect(btn.style.padding).toBe('6px 14px');
    expect(btn.style.borderRadius).toBe('6px');
    // primary variant
    expect(btn.style.background).toBe('rgb(37, 99, 235)');

    const actions: A2uiClientAction[] = [];
    surface.onAction.subscribe((a) => actions.push(a));

    btn.click();
    expect(actions).toHaveLength(1);
    expect(actions[0]!.name).toBe('submit');
    expect(actions[0]!.context).toEqual({ source: 'ui' });
    expect(actions[0]!.sourceComponentId).toBe('root');

    // a second click dispatches again (no stale one-shot capture)
    btn.click();
    expect(actions).toHaveLength(2);
  });

  it('renders its single child and dispatches the action', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Button', variant: 'default', child: 'c', action: { event: { name: 'go' } } },
            { id: 'c', component: 'Text', text: 'Click me' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Button: createDomComponent(buttonBinder, buttonView) });

    const btn = host.querySelector<HTMLButtonElement>('button.a2ui-leaf')!;
    // the child is rendered inside the button
    expect(host.textContent).toContain('Click me');
    expect(btn.querySelector('.a2ui-leaf')).toBeTruthy();

    const actions: A2uiClientAction[] = [];
    surface.onAction.subscribe((a) => actions.push(a));
    btn.click();
    expect(actions).toHaveLength(1);
    expect(actions[0]!.name).toBe('go');
  });

  it('does not fire when disabled', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Button',
              variant: 'primary',
              // a check whose condition resolves to false disables the button
              checks: [{ condition: false, message: 'blocked' }],
              action: { event: { name: 'nope' } },
            },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host } = mount(surface, { Button: createDomComponent(buttonBinder, buttonView) });

    const btn = host.querySelector<HTMLButtonElement>('button.a2ui-leaf')!;
    expect(btn.disabled).toBe(true);
    expect(btn.style.cursor).toBe('not-allowed');

    const actions: A2uiClientAction[] = [];
    surface.onAction.subscribe((a) => actions.push(a));

    btn.click();
    expect(actions).toHaveLength(0);
  });
});
