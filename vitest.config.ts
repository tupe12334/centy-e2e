import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['src/**/*.e2e.spec.ts'],
    exclude: ['src/web/**/*.e2e.spec.ts'],
  },
});
