# ADR-0008: Channel impersonation detector

- **Status:** Accepted (not validated with real cases)
- **Date:** 2026-11-12
- **Decided by:** Habib

## Context

A common scam copies the video channel's identity and asks viewers to write to a phone
number. No real case has been collected yet, so the rule has to be conservative and easy to
tune later. Only handles are available for commenters; the channel's handle and display name
are read from the page.

## Decision

- The real channel is recognized by its exact handle (any letter case) and is never flagged.
  The author badge is not used: it does not identify the owner.
- Handles and the channel name are compared after normalizing: lowercase, accents and
  look-alikes removed, separators (`._-` and spaces) removed, trailing digits removed, and
  common suffixes removed (`official`, `oficial`, `ofc`, `real`, `tv`, `team`, `support`,
  `soporte`, `channel`, `canal`).
- **Two levels** (maintainer's decision):
  1. **Near-identical** (equal, or one edit away for keys of 6+ characters): flagged on its own.
  2. **Similar** (two edits away, one contains the other, or the handle contains a part of the
     channel name of 5+ characters): flagged only if the comment asks for contact (WhatsApp,
     Telegram, `wa.me`, `t.me`, "escríbeme", "contact me", a phone number…).
- Thresholds, suffixes and contact patterns are options (`DEFAULT_IMPERSONATION_OPTIONS`), not
  constants. Exempt phrases also block this detector. It has its own on/off switch (settings
  version 3).

## Consequences

- **Easier:** obvious copies are caught without any keyword.
- **Harder:** fans with handles that include the channel name are flagged if they ask for
  contact in the same comment. A false positive only highlights; the viewer decides.
- **To revisit:** as soon as real impersonation cases are collected, add them as tests and
  retune the options. Profile-picture comparison stays out of the MVP.
