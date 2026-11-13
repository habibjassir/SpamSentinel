import { describe, expect, it } from 'vitest';
import { defaultSettings } from './defaults.ts';
import { SettingsSchema } from './schema.ts';

const valid = defaultSettings('en');

const issuesOf = (value: unknown) => {
  const result = SettingsSchema.safeParse(value);
  return result.success ? [] : result.error.issues;
};

describe('SettingsSchema', () => {
  it('accepts the default settings in both languages', () => {
    expect(issuesOf(defaultSettings('en'))).toEqual([]);
    expect(issuesOf(defaultSettings('es'))).toEqual([]);
  });

  it('rejects an unknown language', () => {
    const [issue] = issuesOf({ ...valid, language: 'fr' });
    expect(issue?.path).toEqual(['language']);
  });

  it('rejects wrong types', () => {
    expect(issuesOf({ ...valid, keywordsEnabled: 'yes' })[0]?.path).toEqual(['keywordsEnabled']);
    expect(issuesOf({ ...valid, exemptPhrases: 'scam' })[0]?.path).toEqual(['exemptPhrases']);
    expect(issuesOf({ ...valid, rules: [{ id: 'x' }] }).length).toBeGreaterThan(0);
  });

  it('rejects an invalid rule with the core validation message and code', () => {
    const rules = [{ ...valid.rules[0]!, kind: 'regex' as const, pattern: 'pre(sale' }];
    const [issue] = issuesOf({ ...valid, rules });
    expect(issue?.path).toEqual(['rules', 0, 'pattern']);
    expect(issue?.message).toMatch(/invalid regular expression/i);
    expect(issue).toMatchObject({ params: { ruleErrorCode: 'regex-invalid' } });
  });

  it('rejects duplicate rule ids', () => {
    const rules = [valid.rules[0]!, { ...valid.rules[1]!, id: valid.rules[0]!.id }];
    const [issue] = issuesOf({ ...valid, rules });
    expect(issue?.path).toEqual(['rules', 1, 'id']);
  });

  it('accepts a scan delay from 250 to 5000 ms and rejects anything else', () => {
    expect(issuesOf({ ...valid, scanDelayMs: 250 })).toEqual([]);
    expect(issuesOf({ ...valid, scanDelayMs: 5000 })).toEqual([]);
    expect(issuesOf({ ...valid, scanDelayMs: 249 })[0]?.path).toEqual(['scanDelayMs']);
    expect(issuesOf({ ...valid, scanDelayMs: 5001 })[0]?.path).toEqual(['scanDelayMs']);
    expect(issuesOf({ ...valid, scanDelayMs: 500.5 })[0]?.path).toEqual(['scanDelayMs']);
    expect(issuesOf({ ...valid, autoScan: 'on' })[0]?.path).toEqual(['autoScan']);
  });

  it('drops unknown keys', () => {
    const parsed = SettingsSchema.parse({ ...valid, somethingElse: true });
    expect(parsed).not.toHaveProperty('somethingElse');
  });
});

describe('defaultSettings', () => {
  it('starts with the core starter rules, the default allowlist and both detectors on', () => {
    const settings = defaultSettings('es');
    expect(settings.language).toBe('es');
    expect(settings.keywordsEnabled).toBe(true);
    expect(settings.campaignsEnabled).toBe(true);
    expect(settings.rules.map((r) => r.pattern)).toEqual([
      '100x',
      'presale',
      'bull run',
      'millionaire',
      'million-maker',
    ]);
    expect(settings.allowlist).toEqual(['Bitcoin', 'BTC', 'Ethereum', 'ETH', 'Solana', 'SOL']);
    expect(settings.exemptPhrases).toEqual([]);
    expect(settings.autoScan).toBe(true);
    expect(settings.scanDelayMs).toBe(500);
    expect(settings.impersonationEnabled).toBe(true);
  });

  it('returns fresh copies, so editing one result never changes the defaults', () => {
    const first = defaultSettings('en');
    first.rules[0]!.pattern = 'changed';
    first.allowlist.push('Dogecoin');
    const second = defaultSettings('en');
    expect(second.rules[0]!.pattern).toBe('100x');
    expect(second.allowlist).not.toContain('Dogecoin');
  });
});
