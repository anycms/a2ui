import { describe, it, expect, vi } from 'vitest';
import { DataModel } from './index';
import { Computed } from '../reactive';

describe('DataModel basic', () => {
  it('get/set round-trip', () => {
    const dm = new DataModel();
    dm.set('/user/name', 'Alice');
    expect(dm.get('/user/name')).toBe('Alice');
  });

  it('auto-vivifies intermediate objects', () => {
    const dm = new DataModel();
    dm.set('/a/b/c', 1);
    expect(dm.get('/a/b/c')).toBe(1);
  });

  it('returns undefined for missing paths', () => {
    const dm = new DataModel();
    expect(dm.get('/missing')).toBeUndefined();
  });

  it('replaceAll replaces the whole root', () => {
    const dm = new DataModel();
    dm.set('/a', 1);
    dm.replaceAll({ x: 1 });
    expect(dm.get('/a')).toBeUndefined();
    expect(dm.get('/x')).toBe(1);
  });
});

describe('DataModel subscriptions', () => {
  it('replays current value on subscribe', () => {
    const dm = new DataModel();
    dm.set('/a', 1);
    const cb = vi.fn();
    dm.subscribe<number>('/a', cb);
    expect(cb).toHaveBeenCalledWith(1);
  });

  it('notifies on exact change', () => {
    const dm = new DataModel();
    const cb = vi.fn();
    dm.subscribe('/a', cb);
    cb.mockClear();
    dm.set('/a', 2);
    expect(cb).toHaveBeenCalledWith(2);
  });

  it('bubbles up: ancestor notified on descendant change', () => {
    const dm = new DataModel();
    dm.set('/a/b', 1);
    const cb = vi.fn();
    dm.subscribe('/a', cb);
    cb.mockClear();
    dm.set('/a/b', 2);
    expect(cb).toHaveBeenCalled();
  });

  it('cascades down: descendant notified on ancestor change', () => {
    const dm = new DataModel();
    dm.set('/a/b/c', 1);
    const cb = vi.fn();
    dm.subscribe('/a/b/c', cb);
    cb.mockClear();
    dm.set('/a/b', { c: 9 });
    expect(cb).toHaveBeenCalledWith(9);
  });

  it('does not notify sibling paths', () => {
    const dm = new DataModel();
    dm.set('/a/b', 1);
    dm.set('/a/c', 2);
    const cb = vi.fn();
    dm.subscribe('/a/c', cb);
    cb.mockClear();
    dm.set('/a/b', 99);
    expect(cb).not.toHaveBeenCalled();
  });

  it('replaceAll notifies all subscribers', () => {
    const dm = new DataModel();
    dm.set('/a', 1);
    const cb = vi.fn();
    dm.subscribe('/a', cb);
    cb.mockClear();
    dm.replaceAll({ a: 5 });
    expect(cb).toHaveBeenCalledWith(5);
  });
});

describe('DataModel reactive bridge', () => {
  it('Computed recomputes when a tracked path changes', () => {
    const dm = new DataModel();
    dm.set('/x', 2);
    const c = new Computed(() => (dm.get('/x') as number) * 10);
    expect(c.value).toBe(20);
    dm.set('/x', 3);
    expect(c.value).toBe(30);
  });

  it('Computed recomputes via cascade when the root is replaced', () => {
    const dm = new DataModel();
    dm.set('/users/0/name', 'Alice');
    const c = new Computed(() => dm.get('/users/0/name'));
    expect(c.value).toBe('Alice');
    dm.replaceAll({ users: [{ name: 'Bob' }] });
    expect(c.value).toBe('Bob');
  });
});
