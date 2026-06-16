import { describe, it, expect } from 'vitest';
import { mergeRegistries } from './index';

describe('mergeRegistries', () => {
  it('keeps base entries and adds new ones from overrides', () => {
    const merged = mergeRegistries(
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
      new Map([['c', 3]]),
    );
    expect([...merged]).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });

  it('later overrides win for the same key', () => {
    const merged = mergeRegistries(
      new Map([['a', 1]]),
      new Map([['a', 2]]),
      new Map([['a', 3]]),
    );
    expect(merged.get('a')).toBe(3);
  });

  it('does not mutate its inputs', () => {
    const base = new Map([['a', 1]]);
    const override = new Map([['a', 99]]);
    mergeRegistries(base, override);
    expect(base.get('a')).toBe(1);
    expect(override.get('a')).toBe(99);
  });

  it('returns a fresh map even with no overrides', () => {
    const base = new Map([['a', 1]]);
    const merged = mergeRegistries(base);
    expect(merged).not.toBe(base);
    expect(merged.get('a')).toBe(1);
  });

  it('accepts and returns ReadonlyMap', () => {
    const ro: ReadonlyMap<string, number> = new Map([['a', 1]]);
    const merged = mergeRegistries(ro);
    expect(merged.size).toBe(1);
  });
});
