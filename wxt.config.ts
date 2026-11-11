import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'SpamSentinel',
    description:
      'Highlights likely spam in YouTube comments using deterministic rules. It never reports for you.',
    // Minimal permissions (see README, "Permissions"). Host access comes only from the
    // content script match pattern in entrypoints/content.ts.
    permissions: ['storage'],
  },
});
