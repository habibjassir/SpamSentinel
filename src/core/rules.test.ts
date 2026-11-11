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
    expect(validateRule(rule({ pattern: '  ​ ' }))[0]?.message).toMatch(/empty/i);
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
