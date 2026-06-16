import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // The workspace core dep and the Vue peer are resolved by the consumer's
  // bundler, not bundled here.
  external: ['@anycms/a2ui-core', 'vue'],
});
