# ADR-0007: Automatic scan and navigation without reload

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decided by:** Habib

## Context

YouTube loads comments in bursts while the viewer scrolls, and moves between videos without
reloading the page. The design doc asks for automatic scanning with a configurable delay
(250 ms to 5 s, default 500 ms) that can be turned off.

## Decision

- A `MutationObserver` on the page body reports changes. Only changes that concern comments
  count: nodes added or removed inside the comment section or a comment thread, or new
  comment threads anywhere. Changes to the video player, the panel and the extension's own
  labels are ignored, so highlighting never triggers another scan.
- **Debounce:** every relevant change restarts a timer; the scan runs once the page has been
  quiet for `scanDelayMs`.
- **Every scan evaluates all loaded comments**, not only the new ones, because the campaign
  detector needs the whole set (it is a pure function of the set, so this is correct and
  cheap: about 20 ms for 500 comments). Highlights are updated in place, so unchanged
  comments are not touched and the page does not flicker.
- **Navigation** uses WXT's `wxt:locationchange` event (Navigation API), not a YouTube event,
  so no YouTube internals are involved. A video page shows the panel and starts watching;
  another video clears highlights and resets the counter; any other page removes the panel.
- **Settings version 2** adds `autoScan` and `scanDelayMs`. A WXT migration adds the defaults
  and keeps every existing value.

## Consequences

- **Easier:** comments are checked without any action, and in-page navigation just works.
- **Harder:** the observer watches the whole body; its filter must stay cheap. If YouTube
  ever fires constant mutations inside the comment section, scans would repeat every delay.
- **To revisit:** evaluating only new comments if very long comment sections become slow.
