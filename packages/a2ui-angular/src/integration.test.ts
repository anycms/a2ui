import { describe, it, expect } from 'vitest';
import { basicCatalogId } from '@anycms/a2ui-core';
import { mount, setup, stable } from './test-utils';

describe('integration: static rendering', () => {
  it('renders a Text component as root', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'Hello A2UI' }] } },
    ]);
    const { host, fixture, unmount } = mount(mp.model.get('s')!);
    await stable(fixture);
    expect(host.textContent).toContain('Hello A2UI');
    unmount();
  });
});

describe('integration: layout integrity', () => {
  it('renders a Row with two Text children', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Row', children: ['a', 'b'] },
            { id: 'a', component: 'Text', text: 'Alpha' },
            { id: 'b', component: 'Text', text: 'Beta' },
          ],
        },
      },
    ]);
    const { host, fixture, unmount } = mount(mp.model.get('s')!);
    await stable(fixture);
    expect(host.querySelector('.a2ui-row')).toBeTruthy();
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).toContain('Beta');
    unmount();
  });
});

describe('integration: two-way binding', () => {
  it('TextField writes back to the data model', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { name: '' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'TextField', label: 'Name', value: { path: '/name' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface);
    const input = host.querySelector('input') as HTMLInputElement;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input'));
    await stable(fixture);
    expect(surface.dataModel.get('/name')).toBe('Alice');
    unmount();
  });
});

describe('integration: reactivity', () => {
  it('UI updates when the data model changes', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { x: 'old' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: { path: '/x' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface);
    await stable(fixture);
    expect(host.textContent).toContain('old');
    surface.dataModel.set('/x', 'new');
    await stable(fixture);
    expect(host.textContent).toContain('new');
    expect(host.textContent).not.toContain('old');
    unmount();
  });
});

describe('integration: action dispatch', () => {
  it('button click fires onAction', async () => {
    const actions: Array<{ name: string; context: Record<string, unknown> }> = [];
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Button', child: 'lbl', action: { event: { name: 'go', context: { who: 'world' } } } },
            { id: 'lbl', component: 'Text', text: 'Go' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const sub = surface.onAction.subscribe((a) => actions.push(a));
    const { host, fixture, unmount } = mount(surface);
    await stable(fixture);
    (host.querySelector('button') as HTMLButtonElement).click();
    await stable(fixture);
    sub.unsubscribe();
    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe('go');
    expect(actions[0].context.who).toBe('world');
    unmount();
  });
});

describe('integration: action context scoping (List template)', () => {
  it('a button click inside a list template dispatches scoped context', async () => {
    const actions: Array<{ name: string; context: Record<string, unknown> }> = [];
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { items: [{ id: 'i1' }, { id: 'i2' }] } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'List', children: { path: '/items', componentId: 'row' } },
            { id: 'row', component: 'Row', children: ['lbl', 'btn'] },
            { id: 'lbl', component: 'Text', text: { path: 'id' } },
            { id: 'btn', component: 'Button', child: 'btnlbl', action: { event: { name: 'select', context: { id: { path: 'id' } } } } },
            { id: 'btnlbl', component: 'Text', text: 'Select' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const sub = surface.onAction.subscribe((a) => actions.push(a));
    const { host, fixture, unmount } = mount(surface);
    await stable(fixture);

    const buttons = Array.from(host.querySelectorAll('button')).filter((b) => b.textContent === 'Select');
    expect(buttons).toHaveLength(2);
    buttons[1].click(); // second item => /items/1
    await stable(fixture);
    sub.unsubscribe();

    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe('select');
    expect(actions[0].context.id).toBe('i2');
    unmount();
  });
});

describe('integration: focus preservation', () => {
  it('typing in a TextField preserves focus (no re-mount on self-emit)', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { name: '' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'TextField', value: { path: '/name' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface);
    const input = host.querySelector('input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    input.value = 'A';
    input.dispatchEvent(new Event('input'));
    await stable(fixture);

    // The [value] binding writes the same value back; focus must survive.
    expect(document.activeElement).toBe(input);
    expect(surface.dataModel.get('/name')).toBe('A');
    unmount();
  });
});

describe('integration: Tabs local state', () => {
  it('selected tab persists across a data-driven re-render', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { t1: 'First' } } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Tabs', tabs: [{ title: { path: '/t1' }, child: 'a' }, { title: 'Second', child: 'b' }] },
            { id: 'a', component: 'Text', text: 'AAA' },
            { id: 'b', component: 'Text', text: 'BBB' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const { host, fixture, unmount } = mount(surface);
    await stable(fixture);

    expect(host.textContent).toContain('AAA');

    const second = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'Second')!;
    second.click();
    await stable(fixture);
    expect(host.textContent).toContain('BBB');

    // trigger a Tabs re-render via a tracked title change — selectedIdx must survive
    surface.dataModel.set('/t1', 'First!');
    await stable(fixture);
    expect(host.textContent).toContain('First!');
    expect(host.textContent).toContain('BBB'); // still on tab 2
    expect(host.textContent).not.toContain('AAA');
    unmount();
  });
});

describe('integration: progressive rendering', () => {
  it('renders nothing then real content when a child arrives late', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Column', children: ['late'] }] } },
    ]);
    const { host, fixture, unmount } = mount(mp.model.get('s')!);
    await stable(fixture);
    const col = host.querySelector('.a2ui-column')!;
    expect(col).toBeTruthy();
    expect(host.textContent).not.toContain('Arrived');

    mp.processMessages([
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'late', component: 'Text', text: 'Arrived' }] } },
    ]);
    await stable(fixture);
    expect(host.textContent).toContain('Arrived');
    unmount();
  });
});

describe('integration: type-change rebuild', () => {
  it('rebuilds the root when its component type changes', async () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'Hello' }] } },
    ]);
    const { host, fixture, unmount } = mount(mp.model.get('s')!);
    await stable(fixture);
    expect(host.textContent).toContain('Hello');
    expect(host.querySelector('.a2ui-leaf')).toBeTruthy();

    mp.processMessages([
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'Column', children: ['c'] },
            { id: 'c', component: 'Text', text: 'World' },
          ],
        },
      },
    ]);
    await stable(fixture);
    expect(host.querySelector('.a2ui-column')).toBeTruthy();
    expect(host.textContent).toContain('World');
    expect(host.textContent).not.toContain('Hello');
    unmount();
  });
});
