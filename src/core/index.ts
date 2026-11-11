// Public entry of the pure core: plain data in, plain data out.
export { DEFAULT_KEYWORD_RULES } from './defaults.ts';
export { evaluateKeywords } from './keywords.ts';
export { normalize } from './normalize.ts';
export { MAX_REGEX_LENGTH, compileRules, validateRule } from './rules.ts';
export type { CompiledRule, CompiledRules, RuleError } from './rules.ts';
export type {
  Comment,
  KeywordReason,
  KeywordRule,
  MatchMode,
  Reason,
  RuleKind,
  Verdict,
} from './types.ts';
export { countWords } from './words.ts';
