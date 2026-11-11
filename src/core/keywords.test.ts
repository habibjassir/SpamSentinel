import { describe, expect, it } from 'vitest';
import { evaluateKeywords } from './keywords.ts';
import { compileRules } from './rules.ts';
import type { Comment, KeywordRule } from './types.ts';

const rule = (overrides: Partial<KeywordRule> = {}): KeywordRule => ({
  id: 'r1',
  kind: 'word',
  pattern: 'presale',
  match: 'whole-word',
  category: 'crypto',
  enabled: true,
  ...overrides,
});

const comment = (text: string): Comment => ({ text, author: '@autor01', isReply: false });

function evaluate(text: string, rules: KeywordRule[], exempt: string[] = []) {
  const compiled = compileRules(rules);
  expect(compiled.errors).toEqual([]);
  return evaluateKeywords(comment(text), compiled.rules, exempt);
}

/** A comment of exactly `n` words whose first word is `first`. */
const words = (n: number, first: string) =>
  [first, ...Array.from({ length: n - 1 }, (_, i) => `w${i}`)].join(' ');

describe('evaluateKeywords', () => {
  it('flags a comment that matches a rule and reports the rule', () => {
    expect(evaluate('Join the PRESALE now', [rule()])).toEqual({
      flagged: true,
      reasons: [{ detector: 'keyword', ruleId: 'r1', category: 'crypto', pattern: 'presale' }],
    });
  });

  it('does not flag a comment without matches', () => {
    expect(evaluate('Great analysis, thanks', [rule()])).toEqual({ flagged: false, reasons: [] });
  });

  it('reports every matching rule', () => {
    const verdict = evaluate('presale before the bull run', [
      rule({ id: 'a' }),
      rule({ id: 'b', kind: 'phrase', pattern: 'bull run' }),
    ]);
    expect(verdict.reasons.map((r) => r.ruleId)).toEqual(['a', 'b']);
  });

  it('matches through look-alike letters, invisible characters and accents', () => {
    expect(evaluate('рrеsаlе', [rule()]).flagged).toBe(true);
    expect(evaluate('pre​sale', [rule()]).flagged).toBe(true);
    expect(evaluate('présálé', [rule()]).flagged).toBe(true);
  });

  it('normalizes the pattern too', () => {
    expect(evaluate('inversion segura', [rule({ pattern: 'Inversión' })]).flagged).toBe(true);
  });

  describe('whole-word vs substring', () => {
    it('whole-word does not match inside a longer word', () => {
      expect(evaluate('presales are open', [rule()]).flagged).toBe(false);
    });

    it('whole-word treats accented letters as part of the word', () => {
      expect(evaluate('señalx', [rule({ pattern: 'senal' })]).flagged).toBe(false);
      expect(evaluate('una señal clara', [rule({ pattern: 'senal' })]).flagged).toBe(true);
    });

    it('whole-word matches next to punctuation', () => {
      expect(evaluate('(presale!)', [rule()]).flagged).toBe(true);
    });

    it('substring matches inside a longer word', () => {
      const r = rule({ pattern: 'millionaire', match: 'substring' });
      expect(evaluate('make millionaires', [r]).flagged).toBe(true);
    });

    it('treats regex special characters in word patterns literally', () => {
      expect(evaluate('100xx gains', [rule({ pattern: '100x.' })]).flagged).toBe(false);
      const r = rule({ pattern: '100x.', match: 'substring' });
      expect(evaluate('a 100x. gain', [r]).flagged).toBe(true);
    });
  });

  describe('regex rules', () => {
    it('run against the normalized text, case-insensitively', () => {
      const r = rule({ kind: 'regex', pattern: 'PRE-?SALE' });
      expect(evaluate('pre-sale', [r]).flagged).toBe(true);
      expect(evaluate('PRÉSALE', [r]).flagged).toBe(true);
    });
  });

  describe('length limits', () => {
    it('a rule with maxWords 30 does not flag a 31-word comment that contains the pattern', () => {
      const r = rule({ maxWords: 30 });
      expect(evaluate(words(31, 'presale'), [r]).flagged).toBe(false);
      expect(evaluate(words(30, 'presale'), [r]).flagged).toBe(true);
    });

    it('a rule with minWords only flags long enough comments', () => {
      const r = rule({ minWords: 5 });
      expect(evaluate(words(4, 'presale'), [r]).flagged).toBe(false);
      expect(evaluate(words(5, 'presale'), [r]).flagged).toBe(true);
    });
  });

  describe('exempt phrases', () => {
    it('prevent a flag even when a rule matches', () => {
      const verdict = evaluate('the presale was a scam, avoid it', [rule()], ['was a scam']);
      expect(verdict).toEqual({ flagged: false, reasons: [] });
    });

    it('are normalized before matching', () => {
      expect(evaluate('PRESALE ES ESTAFA', [rule()], ['presale es estafá']).flagged).toBe(false);
    });

    it('ignore blank entries', () => {
      expect(evaluate('presale', [rule()], ['', '   ']).flagged).toBe(true);
    });
  });
});
