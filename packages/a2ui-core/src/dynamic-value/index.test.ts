import { describe, it, expect, vi } from 'vitest';
import {
  resolveDynamicValue,
  subscribeDynamicValue,
  resolveArgs,
  type DynamicValueContext,
  type FunctionInvoker,
} from './index';
import { DataModel } from '../datamodel';
import { Computed } from '../reactive';

const defaultInvoker: FunctionInvoker = {
  invoke(call, args) {
    return new Computed<unknown>(() => `${call}(${JSON.stringify(args)})`);
  },
};

function makeCtx(dm: DataModel, path = '', invoker: FunctionInvoker = defaultInvoker): DynamicValueContext {
  return { dataModel: dm, path, invoker };
}

describe('resolveDynamicValue', () => {
  it('returns primitives as-is', () => {
    const ctx = makeCtx(new DataModel());
    expect(resolveDynamicValue('hi', ctx)).toBe('hi');
    expect(resolveDynamicValue(42, ctx)).toBe(42);
    expect(resolveDynamicValue(true, ctx)).toBe(true);
    expect(resolveDynamicValue(null, ctx)).toBe(null);
  });

  it('returns literal arrays as-is', () => {
    const ctx = makeCtx(new DataModel());
    expect(resolveDynamicValue([1, 2, 3], ctx)).toEqual([1, 2, 3]);
  });

  it('resolves {path} bindings against the data model', () => {
    const dm = new DataModel();
    dm.set('/user/name', 'Alice');
    expect(resolveDynamicValue({ path: '/user/name' }, makeCtx(dm))).toBe('Alice');
  });

  it('resolves relative {path} against the scope', () => {
    const dm = new DataModel();
    dm.set('/users/0/name', 'Bob');
    expect(resolveDynamicValue({ path: 'name' }, makeCtx(dm, '/users/0'))).toBe('Bob');
  });

  it('invokes {call} via the invoker', () => {
    expect(resolveDynamicValue({ call: 'now' }, makeCtx(new DataModel()))).toBe('now({})');
  });

  it('passes literal config objects through', () => {
    expect(resolveDynamicValue({ format: 'yyyy' }, makeCtx(new DataModel()))).toEqual({
      format: 'yyyy',
    });
  });
});

describe('subscribeDynamicValue', () => {
  it('subscribes to {path} changes', () => {
    const dm = new DataModel();
    dm.set('/a', 1);
    const cb = vi.fn();
    subscribeDynamicValue({ path: '/a' }, makeCtx(dm), cb);
    expect(cb).toHaveBeenLastCalledWith(1);
    dm.set('/a', 2);
    expect(cb).toHaveBeenLastCalledWith(2);
  });

  it('replays literals once', () => {
    const cb = vi.fn();
    subscribeDynamicValue('static', makeCtx(new DataModel()), cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('static');
  });
});

describe('resolveArgs', () => {
  it('recursively resolves nested dynamic values', () => {
    const dm = new DataModel();
    dm.set('/n', 5);
    const ctx = makeCtx(dm);
    const resolved = resolveArgs(
      { value: { path: '/n' }, pattern: '^x$', list: [{ path: '/n' }, 9] },
      ctx,
    );
    expect(resolved).toEqual({ value: 5, pattern: '^x$', list: [5, 9] });
  });
});
