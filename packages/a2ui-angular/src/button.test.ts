import { describe, it, expect } from 'vitest';
import { buttonBinder, basicCatalogId, type A2uiClientAction } from '@anycms/a2ui-core';
import { setup, mount, stable } from './test-utils';
import { createAngularComponent, ButtonViewComponent } from '@anycms/a2ui-angular';

// Register the Button View through the same entry the registry uses, so this
// test exercises the real binding path (mirrors the Vue button.test.ts).
const Button = createAngularComponent(buttonBinder, ButtonViewComponent);

describe('Button (angular)', () => {
  it('dispatches the bound action on click and reflects enabled styles', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Button', variant: 'primary', action: { event: { name: 'submit', context: { source: 'ui' } } } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface, { Button });

    const btn = host.querySelector<HTMLButtonElement>('button.a2ui-leaf')!;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
    await stable(fixture); // let the zoneless style patch flush
    expect(btn.style.cursor).toBe('pointer');
    expect(btn.style.padding).toBe('6px 14px');
    expect(btn.style.borderRadius).toBe('6px');
    expect(btn.style.background).toBe('rgb(37, 99, 235)');

    const actions: A2uiClientAction[] = [];
    const sub = surface.onAction.subscribe((a) => actions.push(a));

    btn.click();
    await stable(fixture);
    expect(actions).toHaveLength(1);
    expect(actions[0]!.name).toBe('submit');
    expect(actions[0]!.context).toEqual({ source: 'ui' });
    expect(actions[0]!.sourceComponentId).toBe('root');

    btn.click();
    await stable(fixture);
    expect(actions).toHaveLength(2);
    sub.unsubscribe();
    unmount();
  });

  it('renders its single child and dispatches the action', async () => {
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
    const { host, fixture, unmount } = mount(surface, { Button });

    const btn = host.querySelector<HTMLButtonElement>('button.a2ui-leaf')!;
    await stable(fixture);
    expect(host.textContent).toContain('Click me');
    expect(btn.querySelector('.a2ui-leaf')).toBeTruthy();

    const actions: A2uiClientAction[] = [];
    const sub = surface.onAction.subscribe((a) => actions.push(a));
    btn.click();
    await stable(fixture);
    sub.unsubscribe();
    expect(actions).toHaveLength(1);
    expect(actions[0]!.name).toBe('go');
    unmount();
  });

  it('does not fire when disabled', async () => {
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
    const { host, fixture, unmount } = mount(surface, { Button });

    const btn = host.querySelector<HTMLButtonElement>('button.a2ui-leaf')!;
    await stable(fixture);
    expect(btn.disabled).toBe(true);
    expect(btn.style.cursor).toBe('not-allowed');

    const actions: A2uiClientAction[] = [];
    const sub = surface.onAction.subscribe((a) => actions.push(a));
    btn.click();
    await stable(fixture);
    sub.unsubscribe();
    expect(actions).toHaveLength(0);
    unmount();
  });
});
