import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['src/**/*.e2e.spec.ts'],
    exclude: ['src/web/**/*.e2e.spec.ts'],
  },
});
