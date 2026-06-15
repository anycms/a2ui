import { describe, it, expect } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { A2uiSurface } from './Surface';
import { MessageProcessor, basicCatalog, basicCatalogId, type A2uiMessage } from '@anycms/a2ui-core';

function setup(messages: A2uiMessage[]) {
  const mp = new MessageProcessor({ catalogs: [basicCatalog] });
  mp.processMessages(messages);
  return mp;
}

describe('static rendering', () => {
  it('renders a Text component as root', () => {
    const mp = setup([
      { version: 'v1.0', createSurface: { surfaceId: 's', catalogId: basicCatalogId } },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Text', text: 'Hello A2UI' }],
        },
      },
    ]);
    render(<A2uiSurface surface={mp.model.get('s')!} />);
    expect(screen.getByText('Hello A2UI')).toBeTruthy();
  });
});

describe('layout integrity', () => {
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
    render(<A2uiSurface surface={mp.model.get('s')!} />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });
});

describe('two-way binding', () => {
  it('TextField writes back to the data model', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { name: '' } },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'TextField', label: 'Name', value: { path: '/name' } },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    render(<A2uiSurface surface={surface} />);
    const input = screen.getByPlaceholderText('Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(surface.dataModel.get('/name')).toBe('Alice');
  });
});

describe('reactivity', () => {
  it('UI updates when the data model changes', () => {
    const mp = setup([
      {
        version: 'v1.0',
        createSurface: { surfaceId: 's', catalogId: basicCatalogId, dataModel: { x: 'old' } },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [{ id: 'root', component: 'Text', text: { path: '/x' } }],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    render(<A2uiSurface surface={surface} />);
    expect(screen.getByText('old')).toBeTruthy();
    act(() => {
      surface.dataModel.set('/x', 'new');
    });
    expect(screen.getByText('new')).toBeTruthy();
  });
});

describe('action context scoping (List template)', () => {
  it('a button click inside a list template dispatches scoped context', () => {
    const actions: Array<{ name: string; context: Record<string, unknown> }> = [];
    const mp = new MessageProcessor({ catalogs: [basicCatalog] });
    mp.processMessages([
      {
        version: 'v1.0',
        createSurface: {
          surfaceId: 's',
          catalogId: basicCatalogId,
          dataModel: { items: [{ id: 'i1' }, { id: 'i2' }] },
        },
      },
      {
        version: 'v1.0',
        updateComponents: {
          surfaceId: 's',
          components: [
            { id: 'root', component: 'List', children: { path: '/items', componentId: 'row' } },
            { id: 'row', component: 'Row', children: ['lbl', 'btn'] },
            { id: 'lbl', component: 'Text', text: { path: 'id' } },
            {
              id: 'btn',
              component: 'Button',
              child: 'btnlbl',
              action: { event: { name: 'select', context: { id: { path: 'id' } } } },
            },
            { id: 'btnlbl', component: 'Text', text: 'Select' },
          ],
        },
      },
    ]);
    const surface = mp.model.get('s')!;
    const sub = surface.onAction.subscribe((a) => actions.push(a));
    render(<A2uiSurface surface={surface} />);
    const buttons = screen.getAllByText('Select');
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]); // second item => /items/1
    expect(actions).toHaveLength(1);
    expect(actions[0].name).toBe('select');
    expect(actions[0].context.id).toBe('i2');
    sub.unsubscribe();
  });
});
