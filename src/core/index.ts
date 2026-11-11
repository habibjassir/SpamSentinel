// Public entry of the pure core: plain data in, plain data out.
export { detectCampaigns, extractCandidates } from './campaign.ts';
export type { CampaignOptions, CampaignResult, CampaignTerm } from './campaign.ts';
export { DEFAULT_ALLOWLIST, DEFAULT_CAMPAIGN_OPTIONS, DEFAULT_KEYWORD_RULES } from './defaults.ts';
export { evaluateAll } from './evaluate.ts';
export type { EvaluationSettings } from './evaluate.ts';
export { evaluateKeywords } from './keywords.ts';
export { normalize, normalizePreservingCase } from './normalize.ts';
export { MAX_REGEX_LENGTH, compileRules, validateRule } from './rules.ts';
export type { CompiledRule, CompiledRules, RuleError } from './rules.ts';
export type {
  CampaignReason,
  Comment,
  KeywordReason,
  KeywordRule,
  MatchMode,
  Reason,
  RuleKind,
  Verdict,
} from './types.ts';
export { countWords } from './words.ts';
