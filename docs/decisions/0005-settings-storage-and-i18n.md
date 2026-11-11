# ADR-0005: Settings storage and interface languages

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decided by:** Habib

## Context

Increment 3 introduces the first persisted data (rules and settings) and the first user
interface, which must be available in Spanish and English.

## Decision

**Storage**

- Settings live in `chrome.storage.local` under one key, through WXT's built-in storage API
  (no extra dependency). The item is versioned (`version: 1`) so later increments can migrate
  the shape with WXT `migrations`.
- **Zod** (approved dependency) validates the shape on every read and write. Rule semantics
  reuse the core's `validateRule`, so there is a single source of truth for what a valid rule
  is.
- Invalid or missing stored data loads as the defaults instead of breaking the page; saving
  invalid settings throws and stores nothing.
- First-run defaults: the core starter rules and allowlist, both detectors on, no exempt
  phrases, language from the browser.

**Languages**

- Strings live in `src/i18n/` as TypeScript objects. `en.ts` defines the keys and `es.ts` is
  typed against them, so a missing translation is a compile error. A test also checks keys and
  `{placeholders}`.
- The user picks the language in Options; the default follows the browser (`es*` → Spanish,
  anything else → English). Chrome's native `_locales` was not used because it cannot switch
  language at runtime.
- The core reports validation errors with stable `code`s; the UI translates them.

**Options page**

- Autosave: every change is saved immediately, except rules, which have a "Save rule" button
  because they are validated first.

**Tests**

- Vitest runs two projects: `core` without any browser, and `extension` with WXT's in-memory
  fake browser. The core never sees browser APIs, even in tests.

## Consequences

- **Easier:** one schema gives validation and TypeScript types; adding a language means adding
  one typed file.
- **Harder:** strings are bundled into the page (a few KB per language).
- **To revisit:** campaign thresholds are not user-editable yet; the popup still shows nothing.
