import { defineConfig } from 'vitest/config';

// The WXT Vitest plugin (fake browser, auto-imports) is intentionally not used
// yet: the core must not see any browser API, even in tests. Add it when
// storage tests need it (Increment 3).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      exclude: ['src/core/**/*.test.ts'],
    },
  },
});
