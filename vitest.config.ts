import { defineConfig } from 'vitest/config';

export default defineConfig({
  workspace: ['packages/*', 'tests/*'],

  test: {
    globals: true,
    environment: 'jsdom',

    coverage: {
      provider: 'istanbul',
      all: true,
      include: ['packages/core/src/**/*.{ts,tsx,js,jsx}'],
      exclude: ['**/node_modules/**', 'tests/**'],

      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
