import { describe, it, expect, vi } from 'vitest';
import { defineBinder, resolveChildList, resolveChild } from './index';
import { ComponentContext } from '../context';
import { SurfaceModel, ComponentModel } from '../components';
import type { FunctionInvoker } from '../dynamic-value';
import { Computed } from '../reactive';

const invoker: FunctionInvoker = {
  invoke: (c) => new Computed<unknown>(() => c),
};

function makeCtx(surface: SurfaceModel, id = 'c', type = 'C', basePath = '') {
  return new ComponentContext({
    surface,
    componentModel: new ComponentModel(id, type, {}),
    basePath,
    invoker,
  });
}

describe('defineBinder', () => {
  it('binds and resolves props from the data model', () => {
    const binder = defineBinder({
      name: 'C',
      schema: {},
      resolve: (ctx) => ({ text: ctx.resolveDynamicValue<string>({ path: '/x' }) }),
    });
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat', dataModel: { x: 'hi' } });
    const binding = binder.bind(makeCtx(surface));
    expect(binding.propsStream.value).toEqual({ text: 'hi' });
    binding.dispose();
  });

  it('emits new props when tracked data changes', () => {
    const binder = defineBinder({
      name: 'C',
      schema: {},
      resolve: (ctx) => ({ v: ctx.resolveDynamicValue({ path: '/n' }) }),
    });
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat', dataModel: { n: 1 } });
    const binding = binder.bind(makeCtx(surface));
    const cb = vi.fn();
    binding.propsStream.subscribe(cb);
    expect(cb).toHaveBeenLastCalledWith({ v: 1 });
    surface.dataModel.set('/n', 2);
    expect(cb).toHaveBeenLastCalledWith({ v: 2 });
    binding.dispose();
  });

  it('dispose releases subscriptions', () => {
    const binder = defineBinder({
      name: 'C',
      schema: {},
      resolve: (ctx) => ctx.resolveDynamicValue({ path: '/n' }),
    });
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat', dataModel: { n: 1 } });
    const binding = binder.bind(makeCtx(surface));
    const cb = vi.fn();
    binding.propsStream.subscribe(cb);
    binding.dispose();
    cb.mockClear();
    surface.dataModel.set('/n', 999);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('resolveChild', () => {
  it('returns a ref for a single ComponentId', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat' });
    expect(resolveChild('inner', makeCtx(surface))).toEqual({ id: 'inner', basePath: '' });
  });

  it('returns null when absent', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat' });
    expect(resolveChild(undefined, makeCtx(surface))).toBeNull();
  });
});

describe('resolveChildList', () => {
  it('resolves a static id list sharing the current scope', () => {
    const surface = new SurfaceModel({ id: 's', catalogId: 'cat' });
    expect(resolveChildList(['a', 'b'], makeCtx(surface, 'row', 'Row'))).toEqual([
      { id: 'a', basePath: '' },
      { id: 'b', basePath: '' },
    ]);
  });

  it('resolves a template into per-item nested scopes', () => {
    const surface = new SurfaceModel({
      id: 's',
      catalogId: 'cat',
      dataModel: { users: [{}, {}] },
    });
    const refs = resolveChildList(
      { componentId: 'tpl', path: '/users' },
      makeCtx(surface, 'list', 'List'),
    );
    expect(refs).toEqual([
      { id: 'tpl', basePath: '/users/0' },
      { id: 'tpl', basePath: '/users/1' },
    ]);
  });

  it('honors a parent base scope when templating', () => {
    const surface = new SurfaceModel({
      id: 's',
      catalogId: 'cat',
      dataModel: { groups: [{ items: [{}, {}] }] },
    });
    const ctx = makeCtx(surface, 'group', 'Column', '/groups/0');
    const refs = resolveChildList({ componentId: 'tpl', path: 'items' }, ctx);
    expect(refs).toEqual([
      { id: 'tpl', basePath: '/groups/0/items/0' },
      { id: 'tpl', basePath: '/groups/0/items/1' },
    ]);
  });
});
