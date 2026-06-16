import { describe, it, expect } from 'vitest';
import { mergeRegistries, basicReactComponents } from './registry';

// Generic merge logic is unit-tested in @anycms/a2ui-core (src/registry). Here
// we only verify the React package re-exports a working helper over the real
// registry (the re-export chain + interop + non-mutation).

describe('mergeRegistries (React re-export)', () => {
  it('overrides a component in the real registry without mutating the base', () => {
    const image = basicReactComponents.get('Image')!;
    const branded = mergeRegistries(basicReactComponents, new Map([['Text', image]]));
    expect(branded.size).toBe(basicReactComponents.size);
    expect(branded.get('Text')).toBe(image); // overridden
    expect(branded.get('Image')).toBe(image); // untouched, shared by ref
    expect(basicReactComponents.get('Text')).not.toBe(image); // base not mutated
  });
});
