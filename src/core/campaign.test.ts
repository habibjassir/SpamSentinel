import { describe, expect, it } from 'vitest';
import { DEFAULT_ALLOWLIST, DEFAULT_CAMPAIGN_OPTIONS } from './defaults.ts';
import { detectCampaigns, extractCandidates } from './campaign.ts';
import type { Comment, Verdict } from './types.ts';

const seedVerdict: Verdict = {
  flagged: true,
  reasons: [{ detector: 'keyword', ruleId: 'r1', category: 'crypto', pattern: 'presale' }],
};
const clean: Verdict = { flagged: false, reasons: [] };

const c = (text: string, author: string): Comment => ({ text, author, isReply: false });

/** Runs the detector where every comment in `seeds` is a keyword seed. */
function detect(seeds: Comment[], others: Comment[] = [], allowlist = DEFAULT_ALLOWLIST) {
  const comments = [...seeds, ...others];
  const verdicts = comments.map((_, i) => (i < seeds.length ? seedVerdict : clean));
  return detectCampaigns(comments, verdicts, allowlist, DEFAULT_CAMPAIGN_OPTIONS);
}

describe('extractCandidates', () => {
  it('takes capitalized words of 3+ letters that do not start a sentence', () => {
    expect(extractCandidates('Buy the presale of Zentro before Monday', [])).toEqual([
      'Zentro',
      'Monday',
    ]);
  });

  it('skips the first word of the text and of every sentence', () => {
    expect(extractCandidates('Mark my words. Zentro wins! Next? Huge… Gains\nWait', [])).toEqual(
      [],
    );
  });

  it('skips words shorter than 3 letters', () => {
    expect(extractCandidates('so I think AI is OK', [])).toEqual([]);
  });

  it('skips allowlisted names in any letter case', () => {
    expect(extractCandidates('buy BTC, Bitcoin, SOLANA and Ethereum', DEFAULT_ALLOWLIST)).toEqual(
      [],
    );
  });

  it('cuts words at apostrophes and hyphens', () => {
    expect(extractCandidates("the Zentro's launch and Ultra-Coin", [])).toEqual([
      'Zentro',
      'Ultra',
      'Coin',
    ]);
  });

  it('sees through disguised capitals', () => {
    // "Zentro" with an invisible character, "ALT" with Cyrillic А and Т
    expect(extractCandidates('get Zen\u200Btro and АLТ now', [])).toEqual(['Zentro', 'ALT']);
  });
});

describe('detectCampaigns', () => {
  const zentro = [
    c('the presale for Zentro is live', '@a1'),
    c('honestly Zentro is a 100x', '@a2'),
    c('do not sleep on Zentro, bull run soon', '@a3'),
  ];

  it('turns a term from 3 different authors into a campaign term', () => {
    const { terms } = detect(zentro);
    expect(terms).toEqual([
      { term: 'zentro', display: 'Zentro', forms: ['Zentro'], seedCount: 3, authorCount: 3 },
    ]);
  });

  it('flags every comment that mentions the term, with the reason', () => {
    const { verdicts } = detect(zentro, [c('what do you think of zentro?', '@x'), c('nice', '@y')]);
    expect(verdicts.map((v) => v.flagged)).toEqual([true, true, true, true, false]);
    expect(verdicts[3]?.reasons).toEqual([
      { detector: 'campaign', term: 'Zentro', seedCount: 3, authorCount: 3 },
    ]);
  });

  it('matches long terms as whole words, ignoring case, accents and disguises', () => {
    const { verdicts } = detect(zentro, [
      c('ZÉNTRO to the moon', '@x'),
      c('zen\u200Btro', '@y'),
      c('Zentros everywhere', '@z'),
    ]);
    expect(verdicts.slice(3).map((v) => v.flagged)).toEqual([true, true, false]);
  });

  it('does not create a term from 3 seeds by the same author', () => {
    const sameAuthor = zentro.map((comment) => ({ ...comment, author: '@a1' }));
    expect(detect(sameAuthor).terms).toEqual([]);
  });

  it('respects minSeeds from the options', () => {
    const comments = zentro.slice(0, 2);
    const verdicts = comments.map(() => seedVerdict);
    const options = { ...DEFAULT_CAMPAIGN_OPTIONS, minSeeds: 2 };
    expect(detectCampaigns(comments, verdicts, [], options).terms.map((t) => t.term)).toEqual([
      'zentro',
    ]);
  });

  it('never turns allowlisted names into terms, in any letter case', () => {
    const seeds = [
      c('the presale beats BITCOIN', '@a1'),
      c('honestly bitcoin and Bitcoin are 100x', '@a2'),
      c('this BiTcOiN bull run', '@a3'),
    ];
    expect(detect(seeds).terms).toEqual([]);
  });

  it('matches short terms only in the exact form seen in seeds', () => {
    const seeds = [
      c('the presale of ALT is live', '@a1'),
      c('honestly ALT is a 100x', '@a2'),
      c('next bull run is ALT season', '@a3'),
    ];
    const { terms, verdicts } = detect(seeds, [
      c('press ALT to continue', '@x'),
      c('alt text matters', '@y'),
      c('hit the Alt key', '@z'),
    ]);
    expect(terms.map((t) => t.display)).toEqual(['ALT']);
    expect(verdicts.slice(3).map((v) => v.flagged)).toEqual([true, false, false]);
  });

  it('counts seeds and authors separately', () => {
    const seeds = [...zentro, c('presale Zentro again', '@a1')];
    expect(detect(seeds).terms[0]).toMatchObject({ seedCount: 4, authorCount: 3 });
  });

  it('uses the most frequent form for display', () => {
    const seeds = [
      c('the presale of ZENTRO', '@a1'),
      c('honestly Zentro is a 100x', '@a2'),
      c('do not sleep on Zentro', '@a3'),
    ];
    expect(detect(seeds).terms[0]?.display).toBe('Zentro');
  });

  it('returns nothing without seeds', () => {
    const { terms, verdicts } = detect([], zentro);
    expect(terms).toEqual([]);
    expect(verdicts.every((v) => !v.flagged)).toBe(true);
  });

  it('rejects mismatched input lengths', () => {
    expect(() => detectCampaigns(zentro, [seedVerdict], [], DEFAULT_CAMPAIGN_OPTIONS)).toThrow(
      /same length/,
    );
  });
});
