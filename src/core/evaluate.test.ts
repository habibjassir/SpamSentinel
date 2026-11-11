import { describe, expect, it } from 'vitest';
import { DEFAULT_ALLOWLIST, DEFAULT_CAMPAIGN_OPTIONS, DEFAULT_KEYWORD_RULES } from './defaults.ts';
import { evaluateAll } from './evaluate.ts';
import type { EvaluationSettings } from './evaluate.ts';
import { compileRules } from './rules.ts';
import type { Comment } from './types.ts';

const c = (text: string, author: string): Comment => ({ text, author, isReply: false });
const { rules } = compileRules(DEFAULT_KEYWORD_RULES);

const settings = (overrides: Partial<EvaluationSettings> = {}): EvaluationSettings => ({
  keywordsEnabled: true,
  campaignsEnabled: true,
  exemptPhrases: [],
  allowlist: DEFAULT_ALLOWLIST,
  campaign: DEFAULT_CAMPAIGN_OPTIONS,
  ...overrides,
});

const comments = [
  c('the presale for Zentro is live', '@a1'),
  c('honestly Zentro is a 100x', '@a2'),
  c('do not sleep on Zentro, bull run soon', '@a3'),
  c('what about Zentro?', '@x'),
  c('great video', '@y'),
];

describe('evaluateAll', () => {
  it('combines keyword and campaign reasons into one verdict per comment', () => {
    const verdicts = evaluateAll(comments, rules, settings());
    expect(verdicts.map((v) => v.flagged)).toEqual([true, true, true, true, false]);
    expect(verdicts[0]?.reasons.map((r) => r.detector)).toEqual(['keyword', 'campaign']);
    expect(verdicts[3]?.reasons.map((r) => r.detector)).toEqual(['campaign']);
  });

  it('with the campaign detector disabled, only keyword reasons remain', () => {
    const verdicts = evaluateAll(comments, rules, settings({ campaignsEnabled: false }));
    expect(verdicts.map((v) => v.flagged)).toEqual([true, true, true, false, false]);
    expect(verdicts.flatMap((v) => v.reasons).every((r) => r.detector === 'keyword')).toBe(true);
  });

  it('with keywords disabled there are no seeds, so nothing is flagged', () => {
    const verdicts = evaluateAll(comments, rules, settings({ keywordsEnabled: false }));
    expect(verdicts.every((v) => !v.flagged)).toBe(true);
  });

  it('exempt phrases also prevent campaign flags', () => {
    const verdicts = evaluateAll(
      [...comments, c('is Zentro a scam? asking', '@z')],
      rules,
      settings({ exemptPhrases: ['a scam'] }),
    );
    expect(verdicts[5]).toEqual({ flagged: false, reasons: [] });
  });
});
