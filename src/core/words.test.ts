import { describe, expect, it } from 'vitest';
import { countWords } from './words.ts';

describe('countWords', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('one two\nthree\tfour')).toBe(4);
  });

  it('returns 0 for empty or blank text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('ignores tokens without letters or digits', () => {
    expect(countWords('gains — soon !!! 🚀')).toBe(2);
  });

  it('counts numbers and accented words', () => {
    expect(countWords('100x en señales')).toBe(3);
  });
});
