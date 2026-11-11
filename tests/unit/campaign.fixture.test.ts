import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ALLOWLIST,
  DEFAULT_CAMPAIGN_OPTIONS,
  DEFAULT_KEYWORD_RULES,
  compileRules,
  detectCampaigns,
  evaluateAll,
  evaluateKeywords,
} from '../../src/core/index.ts';
import type { Comment, EvaluationSettings, Verdict } from '../../src/core/index.ts';
import { fixtureComments, toComment } from './fixture.ts';

// Golden-file test for Increment 2. Numbers come from the issue's acceptance criteria.
const { rules } = compileRules(DEFAULT_KEYWORD_RULES);
const comments = fixtureComments.map(toComment);
const labels = fixtureComments.map((c) => c.label);

const settings = (overrides: Partial<EvaluationSettings> = {}): EvaluationSettings => ({
  keywordsEnabled: true,
  campaignsEnabled: true,
  exemptPhrases: [],
  allowlist: DEFAULT_ALLOWLIST,
  campaign: DEFAULT_CAMPAIGN_OPTIONS,
  ...overrides,
});

const count = (verdicts: Verdict[], label: 'spam' | 'legit') =>
  verdicts.filter((v, i) => labels[i] === label && v.flagged).length;

const keywordVerdicts = (list: Comment[]) => list.map((c) => evaluateKeywords(c, rules, []));

describe('campaign detector against fixtures/comments-WkKhJx0Rz1I.public.json', () => {
  it('flags 21 of 21 spam and 0 of 54 legit', () => {
    const verdicts = evaluateAll(comments, rules, settings());
    expect(count(verdicts, 'spam')).toBe(21);
    expect(count(verdicts, 'legit')).toBe(0);
  });

  it('learns the campaign terms "altorum" (13 seeds) and "ALT" (3 seeds)', () => {
    const { terms } = detectCampaigns(
      comments,
      keywordVerdicts(comments),
      DEFAULT_ALLOWLIST,
      DEFAULT_CAMPAIGN_OPTIONS,
    );
    expect(terms.map((t) => [t.display, t.seedCount])).toEqual([
      ['ALT', 3],
      ['Altorum', 13],
    ]);
  });

  it('does not turn "Mark" (from "Mark my words…", in three seeds) into a term', () => {
    const seeds = comments.filter((_, i) => keywordVerdicts(comments)[i]?.flagged);
    expect(seeds.filter((c) => /\bMark\b/.test(c.text)).length).toBeGreaterThanOrEqual(3);

    const { terms } = detectCampaigns(
      comments,
      keywordVerdicts(comments),
      DEFAULT_ALLOWLIST,
      DEFAULT_CAMPAIGN_OPTIONS,
    );
    expect(terms.map((t) => t.term)).not.toContain('mark');
  });

  it('with the campaign detector disabled, results equal Increment 1 (15 and 0)', () => {
    const verdicts = evaluateAll(comments, rules, settings({ campaignsEnabled: false }));
    expect(verdicts).toEqual(keywordVerdicts(comments));
    expect(count(verdicts, 'spam')).toBe(15);
    expect(count(verdicts, 'legit')).toBe(0);
  });

  it('is incremental-friendly: more comments later gives the same result as all at once', () => {
    const once = evaluateAll(comments, rules, settings());

    // First the page loads half the comments, then the rest arrive.
    evaluateAll(comments.slice(0, 37), rules, settings());
    const again = evaluateAll(comments, rules, settings());
    expect(again).toEqual(once);

    // The order in which comments arrive does not matter either.
    const order = comments.map((_, i) => i).reverse();
    const reversed = evaluateAll(
      order.map((i) => comments[i]!),
      rules,
      settings(),
    );
    order.forEach((original, position) => expect(reversed[position]).toEqual(once[original]));
  });
});
