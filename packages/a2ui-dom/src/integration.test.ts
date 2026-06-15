import { describe, it, expect } from 'vitest';
import { MessageProcessor, basicCatalog, basicCatalogId, type A2uiMessage } from '@anycms/a2ui-core';
import { mountDomSurface } from './surface';

function setup(messages: A2uiMessage[]): MessageProcessor {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

/** Mount into a fresh host using the default registry (all 18 components). */
function mount(mp: MessageProcessor, surfaceId = 's'): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  mountDomSurface(mp.model.get(surfaceId)!, host);
  return host;
}

describe('integration: static rendering', () => {
  it('renders a Text component as root', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'Hello A2UI' }] } },
    ]);
    const host = mount(mp);
    expect(host.textContent).toContain('Hello A2UI');
  });
});

describe('integration: layout integrity', () => {
  it('renders a Row with two Text children', () => {
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
    const host = mount(mp);
    expect(host.querySelector('.a2ui-row')).toBeTruthy();
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).toContain('Beta');
  });
});

describe('integration: two-way binding', () => {
  it('TextField writes back to the data model', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { name: '' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'TextField', label: 'Name', value: { path: '/name' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const host = mount(mp);
    const input = host.querySelector('input') as HTMLInputElement;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input'));
    expect(surface.dataModel.get('/name')).toBe('Alice');
  });
});

describe('integration: reactivity', () => {
  it('UI updates when the data model changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { x: 'old' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: { path: '/x' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const host = mount(mp);
    expect(host.textContent).toContain('old');
    surface.dataModel.set('/x', 'new');
    expect(host.textContent).toContain('new');
    expect(host.textContent).not.toContain('old');
  });
});

describe('integration: action dispatch', () => {
  it('button click fires onAction', () => {
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
    const host = mount(mp);
    (host.querySelector('button') as HTMLButtonElement).click();
    sub.unsubscribe();
    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe('go');
    expect(actions[0].context.who).toBe('world');
  });
});

describe('integration: action context scoping (List template)', () => {
  it('a button click inside a list template dispatches scoped context', () => {
    const actions: Array<{ name: string; context: Record<string, unknown> }> = [];
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { items: [{ id: 'i1' }, { id: 'i2' }] } },
      },
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
    const host = mount(mp);

    const buttons = Array.from(host.querySelectorAll('button')).filter((b) => b.textContent === 'Select');
    expect(buttons).toHaveLength(2);
    buttons[1].click(); // second item => /items/1
    sub.unsubscribe();

    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe('select');
    expect(actions[0].context.id).toBe('i2');
  });
});

describe('integration: focus preservation', () => {
  it('typing in a TextField preserves focus (no re-mount on self-emit)', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { name: '' } } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'TextField', value: { path: '/name' } }] } },
    ]);
    const surface = mp.model.get('s')!;
    const host = mount(mp);
    const input = host.querySelector('input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    input.value = 'A';
    input.dispatchEvent(new Event('input'));

    // The ctx.set -> propsStream emit -> update must NOT clobber focus/value.
    expect(document.activeElement).toBe(input);
    expect(surface.dataModel.get('/name')).toBe('A');
  });
});

describe('integration: Tabs local state', () => {
  it('selected tab persists across a data-driven re-render', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { t1: 'First' } },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            {
              id: 'root',
              component: 'Tabs',
              tabs: [
                { title: { path: '/t1' }, child: 'a' },
                { title: 'Second', child: 'b' },
              ],
            },
            { id: 'a', component: 'Text', text: 'AAA' },
            { id: 'b', component: 'Text', text: 'BBB' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const host = mount(mp);

    // initially tab 0 is selected
    expect(host.textContent).toContain('AAA');

    // click tab 2
    const tabButtons = Array.from(host.querySelectorAll('button'));
    const second = tabButtons.find((b) => b.textContent === 'Second')!;
    second.click();
    expect(host.textContent).toContain('BBB');

    // trigger a Tabs re-render via a tracked title change — selectedIdx must survive
    surface.dataModel.set('/t1', 'First!');
    expect(host.textContent).toContain('First!');
    expect(host.textContent).toContain('BBB'); // still on tab 2
    expect(host.textContent).not.toContain('AAA');
  });
});

describe('integration: progressive rendering', () => {
  it('renders a placeholder then real content when a child arrives late', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Column', children: ['late'] }] } },
    ]);
    const host = mount(mp);
    const col = host.querySelector('.a2ui-column')!;
    expect(col.children).toHaveLength(1);
    expect((col.firstChild as HTMLElement).className).toContain('a2ui-pending');

    mp.processMessages([
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'late', component: 'Text', text: 'Arrived' }] } },
    ]);
    expect(host.textContent).toContain('Arrived');
    expect((col.firstChild as HTMLElement).className).toContain('a2ui-leaf');
  });
});

describe('integration: type-change rebuild', () => {
  it('rebuilds the root when its component type changes', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      { version: 'v1.0', updateComponents: { surfaceId: 's', components: [{ id: 'root', component: 'Text', text: 'Hello' }] } },
    ]);
    const host = mount(mp);
    expect(host.textContent).toContain('Hello');
    expect(host.querySelector('.a2ui-leaf')).toBeTruthy();

    // change root's type Text -> Column
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
    expect(host.querySelector('.a2ui-column')).toBeTruthy();
    expect(host.textContent).toContain('World');
    expect(host.textContent).not.toContain('Hello');
  });
});
