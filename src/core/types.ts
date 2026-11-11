/** A comment as read from the page, reduced to plain data. */
export interface Comment {
  text: string;
  /** Author handle, e.g. "@autor01". */
  author: string;
  isReply: boolean;
}

/**
 * - `word`: a single word, e.g. `presale`.
 * - `phrase`: several words, e.g. `bull run`.
 * - `regex`: a regular expression run against the normalized text.
 */
export type RuleKind = 'word' | 'phrase' | 'regex';

/**
 * - `whole-word`: the pattern must not touch other letters or digits
 *   (`presale` does not match `presales`).
 * - `substring`: the pattern may appear inside a longer word.
 *
 * Ignored by `regex` rules, which control their own boundaries.
 */
export type MatchMode = 'whole-word' | 'substring';

export interface KeywordRule {
  id: string;
  kind: RuleKind;
  pattern: string;
  match: MatchMode;
  /** The rule only applies to comments with at least this many words. */
  minWords?: number;
  /** The rule only applies to comments with at most this many words. */
  maxWords?: number;
  /** Free label shown to the user, e.g. "crypto", "scam". */
  category: string;
  enabled: boolean;
}

/** Why a comment was flagged. Each detector adds its own reason shape. */
export interface KeywordReason {
  detector: 'keyword';
  ruleId: string;
  category: string;
  /** The pattern as the user wrote it. */
  pattern: string;
}

export type Reason = KeywordReason;

export interface Verdict {
  flagged: boolean;
  reasons: Reason[];
}
