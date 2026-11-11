# ADR-0006: Page reader and captured sample page

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decided by:** Habib

## Context

The reader is the only code that knows YouTube's page structure, which changes without
notice. It must be tested without touching real YouTube, and the repository is public, so a
captured page cannot contain real usernames.

## Decision

**Reader**

- All selectors live in `src/page/selectors.ts`; a test fails if YouTube element names or
  ids appear anywhere else in `src/` or `entrypoints/`.
- A thread's own comment is read through `:scope > #comment-container`, so a parent thread
  never picks up the text or author of its nested replies.
- Reply status comes from the `is-sub-thread` attribute. Replies to replies are nested deeper
  and are still replies.
- Text keeps line breaks and emoji. Emoji that YouTube draws as `<img>` contribute their
  `alt` text, because emoji are a useful spam signal.
- `findCommentsSection` returning `null` means the structure changed; a later increment uses
  it to say "page changed" instead of "0 suspicious".

**Sample page**

- `fixtures/page-WkKhJx0Rz1I.html` is the comment section of the same video as the JSON
  fixture, captured on 2026-11-11 with reply threads expanded (one left collapsed).
- Only the elements the reader needs, and their ancestors, are kept; scripts, styles and
  images are removed. Non-ASCII characters are stored as HTML entities, which parse to the
  same text.
- `scripts/pseudonymize-page.mjs` replaces every commenter handle with the pseudonym that
  author has in the JSON fixture, matched by comment text (all 68 comments matched), and
  gives new numbers to anyone else. Raw captures are kept as `fixtures/*.private.html`,
  which is git-ignored.

**Tests**

- The reader tests run in a third Vitest project with `happy-dom` (approved dev dependency).

## Consequences

- **Easier:** when YouTube changes, recapture the sample, rerun the script and adjust one
  file.
- **Harder:** the sample is a snapshot; it cannot detect a YouTube change by itself. The
  manual check against the real video covers that.
- **Note:** the JSON fixture was saved from visible text and lacks emoji drawn as images, so
  the comparison between the two fixtures ignores emoji.
