import { describe, it, expect, vi } from 'vitest';
import { DataContext, ComponentContext } from './index';
import { DataModel } from '../datamodel';
import { SurfaceModel, ComponentModel } from '../components';
import type { FunctionInvoker } from '../dynamic-value';
import { Computed } from '../reactive';

const invoker: FunctionInvoker = {
  invoke: (c) => new Computed<unknown>(() => c),
};

describe('DataContext', () => {
  it('resolves relative paths and supports nesting', () => {
    const dm = new DataModel();
    dm.set('/list/0/name', 'A');
    const ctx = new DataContext(dm, '', invoker);
    const item = ctx.nested('list/0');
    expect(item.path).toBe('/list/0');
    expect(item.resolveDynamicValue<string>({ path: 'name' })).toBe('A');
  });

  it('set writes back through the scope', () => {
    const dm = new DataModel();
    const ctx = new DataContext(dm, '/form', invoker);
    ctx.set('email', 'a@b.c');
    expect(dm.get('/form/email')).toBe('a@b.c');
  });
});

describe('ComponentContext', () => {
  it('dispatches actions tagged with the component id', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat' });
    const component = new ComponentModel('btn', 'Button', {});
    const ctx = new ComponentContext({ surface, componentModel: component, invoker });
    const cb = vi.fn();
    surface.onAction.subscribe(cb);
    ctx.dispatchAction({ name: 'click' });
    expect(cb.mock.calls[0][0].sourceComponentId).toBe('btn');
  });

  it('resolves data through its dataContext', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat', dataModel: { x: 1 } });
    const component = new ComponentModel('t', 'Text', {});
    const ctx = new ComponentContext({ surface, componentModel: component, basePath: '', invoker });
    expect(ctx.resolveDynamicValue<number>({ path: '/x' })).toBe(1);
  });
});
