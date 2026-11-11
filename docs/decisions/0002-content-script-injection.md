# ADR-0002: How the scan reaches the page

- **Status:** Accepted
- **Date:** 2026-11-10
- **Decided by:** Habib
- **Source:** `docs/design.md`, section "ADR-002" (Spanish)

## Context

We had to decide where the code that reads the page lives and which permission the
extension requests. That choice changes the permission warning users see and what automated
tests can verify.

## Options

| Dimension          | A: declared content script                 | B: inject on icon click (`activeTab`)         |
| ------------------ | ------------------------------------------ | --------------------------------------------- |
| Permission         | Permanent access to `youtube.com`          | Access to the current tab, only after a click |
| Permission warning | "Read and change your data on youtube.com" | None                                          |
| Usage              | Works as soon as the video opens           | Click the toolbar icon every time             |
| Automated tests    | Playwright exercises the user's real path  | The icon click cannot be simulated reliably   |
| Automatic scanning | Possible                                   | Not possible without a click first            |

## Decision

**Option A.** Being able to verify every increment automatically, and then automatic
scanning, outweigh the narrower permission.

### Implementation note (Increment 0)

The content script is declared for `https://www.youtube.com/*`, not only for `/watch*` and
`/shorts/*`. YouTube navigates between pages without a full reload, so a script limited to
video URLs would never load when the viewer opens a video from the home page or search
results. The permission warning is the same in both cases. The script checks the URL and
only acts on video and Shorts pages.

## Consequences

- **Easier:** end-to-end testing, and observing the page continuously.
- **Harder:** YouTube changes videos without reloading, so the observer must restart and
  highlights must be cleared on every navigation.
- **To revisit:** if the extension is ever published to the Chrome Web Store, the permanent
  host access must be justified in review.
