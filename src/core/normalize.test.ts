import { describe, expect, it } from 'vitest';
import { normalize, normalizePreservingCase } from './normalize.ts';

describe('normalize', () => {
  it('lowercases text', () => {
    expect(normalize('PreSALE Now')).toBe('presale now');
  });

  it('applies Unicode NFKC (fullwidth letters and ligatures become plain letters)', () => {
    expect(normalize('ｐｒｅｓａｌｅ')).toBe('presale');
    expect(normalize('ﬁnal')).toBe('final');
  });

  it('maps Cyrillic and Greek look-alike letters to Latin', () => {
    // "crypto" written with Cyrillic с, у, р, о
    expect(normalize('сrурtо')).toBe('crypto');
    // "PRESALE" written with Greek capitals Ρ, Ε, Α
    expect(normalize('ΡRΕSΑLΕ')).toBe('presale');
  });

  it('removes zero-width and other invisible characters', () => {
    expect(normalize('pre\u200Bsa\u200Dle\uFEFF')).toBe('presale');
    expect(normalize('bull\u2060 run')).toBe('bull run');
    expect(normalize('pre\u00ADsale')).toBe('presale');
  });

  it('collapses whitespace and trims', () => {
    expect(normalize('  bull \n\t  run  ')).toBe('bull run');
  });

  it('collapses letters repeated 3 or more times down to 2', () => {
    expect(normalize('freeeeee')).toBe('free');
    expect(normalize('moooon')).toBe('moon');
    expect(normalize('cool')).toBe('cool');
  });

  it('does not collapse repeated digits', () => {
    expect(normalize('1000x')).toBe('1000x');
  });

  it('removes accents and other diacritics', () => {
    expect(normalize('Inversión rápida, señal')).toBe('inversion rapida, senal');
    expect(normalize('présale')).toBe('presale');
  });

  it('collapses repeated letters regardless of their case', () => {
    expect(normalize('FREEee')).toBe('free');
  });

  it('is idempotent', () => {
    for (const text of ['  Ｐrésálé \u200B FREEEE  ', 'FREEee', 'İstanbul', 'ВТС']) {
      const once = normalize(text);
      expect(normalize(once)).toBe(once);
    }
  });
});

describe('normalizePreservingCase', () => {
  it('keeps letter case', () => {
    expect(normalizePreservingCase('Join ALT and Altorum')).toBe('Join ALT and Altorum');
  });

  it('applies the same cleanup as normalize, except lowercasing', () => {
    expect(normalizePreservingCase(' Al\u200Btórum  ')).toBe('Altorum');
    expect(normalizePreservingCase('ＡＬＴ')).toBe('ALT');
    expect(normalizePreservingCase('Altooooorum')).toBe('Altoorum');
  });

  it('maps uppercase Cyrillic and Greek look-alikes to Latin capitals', () => {
    // "ALT" written with Cyrillic А and Т
    expect(normalizePreservingCase('АLТ')).toBe('ALT');
    // "BTC" written with Greek Β, Τ and Cyrillic С
    expect(normalizePreservingCase('ΒΤС')).toBe('BTC');
  });

  it('agrees with normalize once lowercased', () => {
    for (const text of ['АLТorum', 'ΡRΕSΑLΕ', 'Inversión', 'FREEee']) {
      expect(normalize(normalizePreservingCase(text))).toBe(normalize(text));
    }
  });
});
