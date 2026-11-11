import { expect, it } from 'vitest';
import { DEFAULT_KEYWORD_RULES, compileRules, evaluateKeywords } from '../../src/core/index.ts';
import type { Comment, KeywordRule } from '../../src/core/index.ts';
import { fixtureComments, toComment } from './fixture.ts';

// Design goal: 500 comments x 50 rules evaluated in under 200 ms.
// Do not relax this number; report the measurement instead (CLAUDE.md).
const BUDGET_MS = 200;

const comments: Comment[] = Array.from({ length: 500 }, (_, i) => {
  const c = toComment(fixtureComments[i % fixtureComments.length]!);
  return { ...c, text: `${c.text} ${i}` };
});

const kinds = ['word', 'phrase', 'regex'] as const;
const patternFor = (kind: (typeof kinds)[number], i: number) =>
  kind === 'word' ? `token${i}` : kind === 'phrase' ? `free gift ${i}` : `win+ing\\s*${i}`;

const extraRules: KeywordRule[] = Array.from({ length: 45 }, (_, i) => {
  const kind = kinds[i % kinds.length]!;
  return {
    id: `perf-${i}`,
    kind,
    pattern: patternFor(kind, i),
    match: i % 2 === 0 ? 'whole-word' : 'substring',
    ...(i % 4 === 0 ? { maxWords: 60 } : {}),
    category: 'perf',
    enabled: true,
  };
});

it(`evaluates 500 comments x 50 rules in under ${BUDGET_MS} ms`, () => {
  const allRules = [...DEFAULT_KEYWORD_RULES, ...extraRules];
  expect(allRules).toHaveLength(50);
  const { rules, errors } = compileRules(allRules);
  expect(errors).toEqual([]);

  // Compilation happens once when rules are saved, so only evaluation is timed.
  const start = performance.now();
  for (const comment of comments) evaluateKeywords(comment, rules, ['was a scam']);
  const elapsed = performance.now() - start;

  console.info(`[performance] 500 comments x 50 rules: ${elapsed.toFixed(1)} ms`);
  expect(elapsed).toBeLessThan(BUDGET_MS);
});
