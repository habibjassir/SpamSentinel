import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// Two projects with different environments:
// - core: no browser at all, so the pure core cannot lean on browser APIs even in tests.
// - extension: WXT's plugin provides an in-memory fake browser (storage, i18n code).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          include: ['src/core/**/*.test.ts', 'tests/unit/**/*.test.ts'],
        },
      },
      {
        plugins: [WxtVitest()],
        test: {
          name: 'extension',
          include: ['src/storage/**/*.test.ts', 'src/i18n/**/*.test.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      exclude: ['src/core/**/*.test.ts'],
      reporter: ['text', 'html'],
      // Acceptance criterion: at least 90% line coverage of src/core/.
      thresholds: { lines: 90 },
    },
  },
});
