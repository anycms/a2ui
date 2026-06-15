import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // React, Radix and the workspace deps are resolved by the consumer's bundler.
  external: [
    'react',
    'react-dom',
    '@anycms/a2ui-core',
    '@anycms/a2ui-react',
    /^@radix-ui\//,
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'lucide-react',
  ],
});
