/**
 * Merge multiple read-only registries (`Map`s) into a new `ReadonlyMap`; later
 * arguments override earlier ones by key. Inputs are never mutated.
 *
 * Framework-agnostic and fully generic — each adapter (`a2ui-react`,
 * `a2ui-vue`, `a2ui-angular`) re-exports it, narrowed to its own registry
 * value type, so consumers can layer brand/preset overrides on a base
 * registry without hand-rolled `new Map(base)` + `.set()` loops.
 *
 * @example
 *   const branded = mergeRegistries(basicReactComponents, brandOverrides);
 */
export function mergeRegistries<K, V>(
  base: ReadonlyMap<K, V>,
  ...overrides: ReadonlyArray<ReadonlyMap<K, V>>
): ReadonlyMap<K, V> {
  const merged = new Map(base);
  for (const o of overrides) {
    for (const [key, value] of o) merged.set(key, value);
  }
  return merged;
}
