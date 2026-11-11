# ADR-0004: Repeated-campaign detector

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decided by:** Habib

## Context

In the sample, every spam comment promotes the same unknown token ("Altorum"), but only 15
of 21 use a promotional keyword. Keyword rules cannot know the name of the next token in
advance.

## Decision

Learn the token name from comments the keyword rules already flagged (the seeds):

1. **Candidates:** words in a seed that start with an uppercase letter, are at least
   `minTermLength` (3) characters long, do not start a sentence, and are not in the
   allowlist (compared in any letter case). A sentence starts at the beginning of the text,
   after `.`, `!`, `?` or `…`, and after a line break. Without this rule, "Mark" (from "Mark
   my words…") would become a term.
2. **Campaign term:** a candidate found in seeds from at least `minSeeds` (3) **different
   authors**, so one spammer repeating a word is not enough.
3. **Flagging:** every comment containing a campaign term as a whole word is flagged, with a
   structured reason (`term`, `seedCount`, `authorCount`). The user-facing sentence is built
   by the UI, in Spanish or English.
4. **Short terms** (`caseSensitiveMaxLength`, 4 characters or fewer, e.g. "ALT") only match
   the exact forms seen in seeds, so "ALT" does not hit "alt" or "Alt".

Related choices:

- **With keyword rules disabled, the campaign detector has no seeds and flags nothing**
  (maintainer's decision, option A). Turning keywords off means nothing derived from them
  runs either.
- **Exempt phrases block campaign flags too**, so "never flagged" holds for every detector.
- The detector is a pure function of the set of comments: the result does not depend on
  their order or on earlier calls, so it can simply be re-run as YouTube loads more.
- `normalizePreservingCase` was added (all of `normalize` except lowercasing) to detect
  capitalized words through disguises. `normalize` is now defined on top of it.

## Consequences

- **Easier:** any token outside the allowlist is caught without knowing its name.
- **Harder:** a legitimate name that several flagged comments happen to mention could become
  a term. Thresholds are configuration (`DEFAULT_CAMPAIGN_OPTIONS`) to be tuned with more
  samples, and the allowlist is user-editable.
- **To revisit:** sentence detection is simple; abbreviations such as "Mr. Smith" start a new
  "sentence" and hide "Smith". That errs on the side of fewer terms.
