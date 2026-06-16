import { defineConfig } from 'vitest/config';

// Tests import the AOT-compiled components from the built package (`dist`),
// not the source — so no JIT decorator transform is needed here.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
