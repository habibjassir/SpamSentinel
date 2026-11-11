# ADR-0003: Text normalization and keyword matching

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decided by:** Habib

## Context

Spammers disguise words to slip past filters: Cyrillic letters that look Latin ("рrеsаlе"),
invisible characters ("pre​sale"), accents ("présále") and stretched letters
("freeeee"). Keyword rules must still match, without flagging legitimate comments.

## Decision

The same `normalize` function is applied to comment text, rule patterns and exempt
phrases, so matching is symmetric. Steps, in order:

1. Unicode NFKC (fullwidth letters and ligatures become plain letters).
2. Remove invisible characters (`Default_Ignorable_Code_Point` and format characters).
3. Lowercase.
4. **Remove accents and other diacritics.** "inversión" and "inversion" are equal.
5. Map a conservative set of Cyrillic and Greek look-alike letters to Latin.
6. Collapse letters repeated 3+ times down to 2. Digits are not collapsed, so "1000x" never
   becomes "100x".
7. Collapse whitespace and trim.

Matching rules:

- Whole-word matching uses Unicode-aware boundaries (no letter or digit on either side),
  because JavaScript's `\b` treats accented letters as separators.
- Regex rules are not normalized (that would break their syntax); they run case-insensitively
  against the normalized text. Regexes are limited to 200 characters, and a regex that
  matches empty text is rejected because it would flag every comment.
- Patterns are compiled once (`compileRules`) and `evaluateKeywords` receives the compiled
  rules, so nothing is compiled per comment.

## Consequences

- **Easier:** one rule catches accented, disguised and stretched variants.
- **Harder:** some distinct words become equal after removing accents ("año" and "ano").
  The cost is low: a false positive only highlights, and the viewer decides.
- **Harder:** a regex must be written for normalized text (lowercase, no accents).
