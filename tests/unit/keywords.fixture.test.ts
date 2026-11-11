import { describe, expect, it } from 'vitest';
import { DEFAULT_KEYWORD_RULES, compileRules, evaluateKeywords } from '../../src/core/index.ts';
import { fixtureComments, toComment } from './fixture.ts';

// Golden-file test: the exact numbers come from the issue's acceptance criteria.
describe('starter keyword rules against fixtures/comments-WkKhJx0Rz1I.public.json', () => {
  const { rules, errors } = compileRules(DEFAULT_KEYWORD_RULES);
  const results = fixtureComments.map((c) => ({
    label: c.label,
    verdict: evaluateKeywords(toComment(c), rules, []),
  }));
  const spam = results.filter((r) => r.label === 'spam');
  const legit = results.filter((r) => r.label === 'legit');

  it('uses the expected sample: 21 spam and 54 legit', () => {
    expect(errors).toEqual([]);
    expect(spam).toHaveLength(21);
    expect(legit).toHaveLength(54);
  });

  it('flags exactly 15 of 21 spam comments', () => {
    expect(spam.filter((r) => r.verdict.flagged)).toHaveLength(15);
  });

  it('flags 0 of 54 legit comments', () => {
    expect(legit.filter((r) => r.verdict.flagged)).toHaveLength(0);
  });

  it('reports the matching rule(s) for every flagged comment', () => {
    const ids = DEFAULT_KEYWORD_RULES.map((r) => r.id);
    for (const { verdict } of results.filter((r) => r.verdict.flagged)) {
      expect(verdict.reasons.length).toBeGreaterThan(0);
      for (const reason of verdict.reasons) expect(ids).toContain(reason.ruleId);
    }
  });
});
