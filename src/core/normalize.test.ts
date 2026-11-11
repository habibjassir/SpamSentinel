import { describe, expect, it } from 'vitest';
import { normalize } from './normalize.ts';

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
    expect(normalize('pre​sa‍le﻿')).toBe('presale');
    expect(normalize('bull⁠ run')).toBe('bull run');
    expect(normalize('pre­sale')).toBe('presale');
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

  it('is idempotent', () => {
    const once = normalize('  Ｐrésálé ​ FREEEE  ');
    expect(normalize(once)).toBe(once);
  });
});
