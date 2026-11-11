// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import wxtAutoImports from './.wxt/eslint-auto-imports.mjs';

const CORE_MESSAGE =
  'src/core/ must stay pure: no browser, DOM or WXT APIs. Pass plain data in and return plain data out.';

// Globals that src/core/ must never touch. Explicit entries give a clear
// message; no-undef below catches every other browser or WXT global.
const coreRestrictedGlobals = [
  'chrome',
  'browser',
  'document',
  'window',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'fetch',
  'XMLHttpRequest',
  'MutationObserver',
  'HTMLElement',
  'Element',
  'Node',
].map((name) => ({ name, message: CORE_MESSAGE }));

export default tseslint.config(
  {
    ignores: [
      '.output/',
      '.wxt/',
      'node_modules/',
      'coverage/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,

  // Extension code (entrypoints, page, storage) runs in the browser and may use
  // WXT auto-imports such as defineContentScript.
  {
    files: ['entrypoints/**', 'src/**'],
    ...wxtAutoImports,
    languageOptions: {
      ...wxtAutoImports.languageOptions,
      globals: { ...globals.browser, ...wxtAutoImports.languageOptions?.globals },
    },
  },

  // Tooling, tests and config files run in Node.
  {
    files: ['*.{js,mjs,ts}', 'scripts/**', 'tests/**'],
    languageOptions: { globals: globals.node },
  },

  // The pure core: only plain ECMAScript globals are allowed.
  {
    files: ['src/core/**'],
    languageOptions: { globals: globals.es2024 },
    rules: {
      'no-undef': 'error',
      'no-restricted-globals': ['error', ...coreRestrictedGlobals],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '#imports', message: CORE_MESSAGE },
            { name: 'wxt', message: CORE_MESSAGE },
            { name: 'webextension-polyfill', message: CORE_MESSAGE },
          ],
          patterns: [
            { group: ['wxt/*', '@wxt-dev/*'], message: CORE_MESSAGE },
            { group: ['**/page/*', '**/storage/*', '**/entrypoints/*'], message: CORE_MESSAGE },
          ],
        },
      ],
    },
  },

  prettier,
);
