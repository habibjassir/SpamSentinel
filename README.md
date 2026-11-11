# SpamSentinel

A Chrome and Brave extension (Manifest V3) for **viewers** of YouTube videos. It reads the
comments already loaded on the page, evaluates them with deterministic rules (no AI), and
highlights the ones that look like spam, showing which rule matched.

> **Status:** early development. On video pages the extension scans comments as they load and
> highlights suspicious ones; see [`docs/design.md`](docs/design.md) (in Spanish) for the plan.

## What it does

- Scans the comments YouTube has already loaded on a video page.
- Highlights likely spam and says which rule matched, so you can decide.
- Keeps your rules and settings in your browser (`chrome.storage`).

## What it does not do

- **It never reports, clicks or submits anything on YouTube.** You report comments yourself
  with YouTube's own menu. Automating that would break YouTube's terms and put your account
  at risk.
- It makes **no network calls**: no YouTube API, no server, no analytics, no remote code.
- It does not store or send the comments it reads.

## Options

Open the extension's options (right-click the toolbar icon → **Options**) to:

- add, edit, enable or delete keyword rules (word, phrase or regular expression, with optional
  word limits);
- manage exempt phrases (comments containing them are never flagged) and allowed names (never
  treated as campaign terms);
- turn each detector on or off;
- turn automatic scanning on or off, and set how long to wait after comments stop loading
  (250 to 5000 ms, default 500);
- switch the interface between Spanish and English.

Changes are saved automatically in your browser.

## Permissions

| Permission                            | Why                                                                                                                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                             | Save your rules and settings locally.                                                                                                                                                                           |
| Content script on `www.youtube.com/*` | Read and highlight comments. Declared for the whole site because YouTube changes pages without reloading; the script only acts on video pages. See [ADR-0002](docs/decisions/0002-content-script-injection.md). |

## Build it

Requirements: [Node.js](https://nodejs.org/) 22 or newer and pnpm (run `corepack enable` once).

```bash
pnpm install
pnpm build      # output in .output/chrome-mv3
pnpm zip        # installable zip in .output/
```

Every pull request also builds the zip in GitHub Actions; download it from the run's
**Artifacts** section.

## Load it unpacked

**Chrome**

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `.output/chrome-mv3` folder (or unzip the zip and
   select that folder).

**Brave**

1. Open `brave://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the same folder.

## Development

```bash
pnpm dev          # WXT dev mode with hot reload
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint + Prettier check
pnpm test         # Vitest unit tests
pnpm e2e          # Playwright: loads the built extension in Chromium (run pnpm build first)
pnpm verify       # typecheck + lint + test + build + manifest permission check
```

The first `pnpm e2e` needs Playwright's Chromium: `pnpm exec playwright install chromium`.

## License

[MIT](LICENSE) © 2026 Habib Jassir.

The comment texts in `fixtures/` are public YouTube comments written by third parties,
pseudonymized and included only as test data. They are not covered by the project's license.
