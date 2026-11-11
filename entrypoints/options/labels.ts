import { MAX_REGEX_LENGTH } from '../../src/core/index.ts';
import type { KeywordRule, MatchMode, RuleErrorCode, RuleKind } from '../../src/core/index.ts';
import { format } from '../../src/i18n/index.ts';
import type { Messages } from '../../src/i18n/index.ts';

export const kindLabel = (t: Messages, kind: RuleKind) =>
  ({ word: t.kindWord, phrase: t.kindPhrase, regex: t.kindRegex })[kind];

export const matchLabel = (t: Messages, match: MatchMode) =>
  ({ 'whole-word': t.matchWholeWord, substring: t.matchSubstring })[match];

export function wordsLabel(t: Messages, rule: KeywordRule): string {
  const { minWords: min, maxWords: max } = rule;
  if (min !== undefined && max !== undefined) return format(t.wordsBetween, { min, max });
  if (min !== undefined) return format(t.wordsMin, { min });
  if (max !== undefined) return format(t.wordsMax, { max });
  return t.wordsAny;
}

/** Translates a core validation error code into the selected language. */
export function ruleErrorMessage(t: Messages, code: RuleErrorCode): string {
  const byCode: Record<RuleErrorCode, string> = {
    'id-empty': t.errorIdEmpty,
    'id-duplicate': t.errorIdDuplicate,
    'pattern-empty': t.errorPatternEmpty,
    'word-has-spaces': t.errorWordHasSpaces,
    'regex-invalid': t.errorRegexInvalid,
    'regex-too-long': format(t.errorRegexTooLong, { limit: MAX_REGEX_LENGTH }),
    'regex-matches-empty': t.errorRegexMatchesEmpty,
    'min-words-invalid': t.errorMinWordsInvalid,
    'max-words-invalid': t.errorMaxWordsInvalid,
    'words-range': t.errorWordsRange,
  };
  return byCode[code];
}
