import { describe, expect, it } from 'vitest';
import { MAX_REGEX_LENGTH, compileRules, validateRule } from './rules.ts';
import type { KeywordRule } from './types.ts';

const rule = (overrides: Partial<KeywordRule> = {}): KeywordRule => ({
  id: 'r1',
  kind: 'word',
  pattern: 'presale',
  match: 'whole-word',
  category: 'crypto',
  enabled: true,
  ...overrides,
});

describe('validateRule', () => {
  it('accepts a valid rule', () => {
    expect(validateRule(rule())).toEqual([]);
  });

  it('rejects an empty or blank pattern', () => {
    expect(validateRule(rule({ pattern: '' }))[0]?.message).toMatch(/empty/i);
    expect(validateRule(rule({ pattern: '  \u200B ' }))[0]?.message).toMatch(/empty/i);
  });

  it('rejects an empty id', () => {
    expect(validateRule(rule({ id: ' ' }))[0]?.field).toBe('id');
  });

  it('rejects a word rule that contains spaces', () => {
    expect(validateRule(rule({ pattern: 'bull run' }))[0]?.message).toMatch(/single word/i);
  });

  it('rejects an invalid regex with a clear error', () => {
    const [error] = validateRule(rule({ kind: 'regex', pattern: 'pre(sale' }));
    expect(error?.field).toBe('pattern');
    expect(error?.message).toMatch(/invalid regular expression/i);
  });

  it('rejects a regex longer than the limit', () => {
    const [error] = validateRule(
      rule({ kind: 'regex', pattern: 'a'.repeat(MAX_REGEX_LENGTH + 1) }),
    );
    expect(error?.field).toBe('pattern');
    expect(error?.message).toMatch(new RegExp(`${MAX_REGEX_LENGTH} characters`));
  });

  it('accepts a regex exactly at the limit', () => {
    const pattern = 'a'.repeat(MAX_REGEX_LENGTH);
    expect(validateRule(rule({ kind: 'regex', pattern }))).toEqual([]);
  });

  it('rejects a regex that matches empty text (it would flag every comment)', () => {
    const [error] = validateRule(rule({ kind: 'regex', pattern: 'x*' }));
    expect(error?.message).toMatch(/empty text/i);
  });

  it('rejects invalid word limits', () => {
    expect(validateRule(rule({ minWords: -1 }))[0]?.field).toBe('minWords');
    expect(validateRule(rule({ maxWords: 2.5 }))[0]?.field).toBe('maxWords');
    expect(validateRule(rule({ minWords: 10, maxWords: 5 }))[0]?.field).toBe('maxWords');
  });
});

describe('error codes', () => {
  // Stable codes let the options page show errors in the user's language.
  const codeOf = (overrides: Partial<KeywordRule>) => validateRule(rule(overrides))[0]?.code;

  it('gives every validation error a stable code', () => {
    expect(codeOf({ id: '' })).toBe('id-empty');
    expect(codeOf({ pattern: '' })).toBe('pattern-empty');
    expect(codeOf({ kind: 'regex', pattern: ' ' })).toBe('pattern-empty');
    expect(codeOf({ pattern: 'bull run' })).toBe('word-has-spaces');
    expect(codeOf({ kind: 'regex', pattern: '(' })).toBe('regex-invalid');
    expect(codeOf({ kind: 'regex', pattern: 'a'.repeat(MAX_REGEX_LENGTH + 1) })).toBe(
      'regex-too-long',
    );
    expect(codeOf({ kind: 'regex', pattern: 'x*' })).toBe('regex-matches-empty');
    expect(codeOf({ minWords: -1 })).toBe('min-words-invalid');
    expect(codeOf({ maxWords: 1.5 })).toBe('max-words-invalid');
    expect(codeOf({ minWords: 5, maxWords: 2 })).toBe('words-range');
  });

  it('marks duplicate ids with their own code', () => {
    const { errors } = compileRules([rule({ id: 'same' }), rule({ id: 'same' })]);
    expect(errors.map((e) => e.code)).toEqual(['id-duplicate']);
  });
});

describe('compileRules', () => {
  it('compiles enabled valid rules and reports invalid ones', () => {
    const { rules, errors } = compileRules([
      rule({ id: 'ok' }),
      rule({ id: 'bad', kind: 'regex', pattern: '(' }),
      rule({ id: 'off', enabled: false }),
    ]);
    expect(rules.map((r) => r.rule.id)).toEqual(['ok']);
    expect(errors.map((e) => e.ruleId)).toEqual(['bad']);
  });

  it('still validates disabled rules', () => {
    const { errors } = compileRules([rule({ id: 'off', enabled: false, pattern: '' })]);
    expect(errors.map((e) => e.ruleId)).toEqual(['off']);
  });

  it('rejects duplicate ids', () => {
    const { errors } = compileRules([rule({ id: 'same' }), rule({ id: 'same' })]);
    expect(errors).toEqual([expect.objectContaining({ ruleId: 'same', field: 'id' })]);
  });
});
