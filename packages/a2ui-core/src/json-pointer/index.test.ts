import { describe, it, expect } from 'vitest';
import {
  escapeToken,
  unescapeToken,
  parsePointer,
  resolvePointer,
  pointerFromTokens,
  get,
  set,
  isPrefix,
  isRelated,
} from './index';

describe('token escaping', () => {
  it('round-trips ~ and /', () => {
    expect(escapeToken('a/b~c')).toBe('a~1b~0c');
    expect(unescapeToken('a~1b~0c')).toBe('a/b~c');
  });
});

describe('parsePointer', () => {
  it('parses segments and unescapes', () => {
    expect(parsePointer('/a/b')).toEqual(['a', 'b']);
    expect(parsePointer('/a~1b')).toEqual(['a/b']);
    expect(parsePointer('')).toEqual([]);
    expect(parsePointer('/')).toEqual([]);
  });

  it('rejects non-absolute pointers', () => {
    expect(() => parsePointer('a/b')).toThrow();
  });
});

describe('resolvePointer (A2UI relative paths)', () => {
  it('absolute pointers ignore the base scope', () => {
    expect(resolvePointer('/a/b', '/users/0')).toEqual(['a', 'b']);
  });

  it('relative pointers resolve against the base scope', () => {
    expect(resolvePointer('name', '/users/0')).toEqual(['users', '0', 'name']);
    expect(resolvePointer('addr/city', '/users/0')).toEqual([
      'users',
      '0',
      'addr',
      'city',
    ]);
  });

  it('relative against root scope', () => {
    expect(resolvePointer('foo')).toEqual(['foo']);
    expect(resolvePointer('foo', '')).toEqual(['foo']);
  });
});

describe('get', () => {
  const root = { a: { b: { c: 42 } }, arr: [10, 20, 30] };

  it('reads nested values', () => {
    expect(get(root, ['a', 'b', 'c'])).toBe(42);
    expect(get(root, ['arr', '1'])).toBe(20);
  });

  it('returns undefined for missing paths', () => {
    expect(get(root, ['a', 'x'])).toBeUndefined();
    expect(get(root, ['missing', 'deep'])).toBeUndefined();
    expect(get(undefined, ['a'])).toBeUndefined();
  });
});

describe('set (auto-vivification)', () => {
  it('creates missing intermediate objects', () => {
    const root: Record<string, unknown> = {};
    set(root, ['a', 'b', 'c'], 1);
    expect(root).toEqual({ a: { b: { c: 1 } } });
  });

  it('creates arrays for numeric next-segments', () => {
    const root: Record<string, unknown> = {};
    set(root, ['items', '0', 'name'], 'x');
    expect(root).toEqual({ items: [{ name: 'x' }] });
    expect(Array.isArray((root as any).items)).toBe(true);
  });

  it('overwrites an existing value', () => {
    const root = { a: { b: 1 } };
    set(root, ['a', 'b'], 2);
    expect((root as any).a.b).toBe(2);
  });

  it('deletes the key when value is undefined (object)', () => {
    const root: any = { a: { b: 1, c: 2 } };
    set(root, ['a', 'b'], undefined);
    expect(root.a).toEqual({ c: 2 });
  });

  it('sparsifies arrays when value is undefined', () => {
    const root: any = { arr: [1, 2, 3] };
    set(root, ['arr', '1'], undefined);
    expect(root.arr.length).toBe(3); // length preserved
    expect(0 in root.arr).toBe(true);
    expect(1 in root.arr).toBe(false); // slot emptied
    expect(2 in root.arr).toBe(true);
  });

  it('rejects empty tokens (root replacement)', () => {
    expect(() => set({}, [], 'x')).toThrow();
  });
});

describe('pointerFromTokens', () => {
  it('rebuilds a pointer string', () => {
    expect(pointerFromTokens(['a', 'b'])).toBe('/a/b');
    expect(pointerFromTokens(['a/b'])).toBe('/a~1b');
    expect(pointerFromTokens([])).toBe('');
  });
});

describe('isPrefix / isRelated', () => {
  it('isPrefix detects leading subsequences', () => {
    expect(isPrefix(['a'], ['a', 'b'])).toBe(true);
    expect(isPrefix(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isPrefix(['a', 'b'], ['a'])).toBe(false);
    expect(isPrefix(['a'], ['b'])).toBe(false);
  });

  it('isRelated covers exact / bubble-up / cascade-down', () => {
    // exact
    expect(isRelated(['a', 'b'], ['a', 'b'])).toBe(true);
    // bubble up: subscription '/a' related to set '/a/b'
    expect(isRelated(['a'], ['a', 'b'])).toBe(true);
    // cascade down: subscription '/a/b/c' related to set '/a/b'
    expect(isRelated(['a', 'b', 'c'], ['a', 'b'])).toBe(true);
    // unrelated
    expect(isRelated(['a', 'b'], ['c'])).toBe(false);
    // sibling is NOT related
    expect(isRelated(['a', 'b'], ['a', 'c'])).toBe(false);
  });
});
