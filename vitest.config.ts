import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  workspace: ['packages/*', 'tests/*'],
  resolve: {
    alias: [
      {
        find: '@sugarform/core',
        replacement: fileURLToPath(
          new URL('./packages/core/src/lib.ts', import.meta.url)
        ),
      },
    ],
  },
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
