import type { KeywordRule } from './types.ts';

/**
 * Starter rules (English), taken from the promotional phrases found in real
 * spam (docs/design.md, "Segunda recolección"). Users can edit or disable them.
 *
 * `millionaire` and `million-maker` use substring matching so plurals such as
 * "millionaires" are caught too.
 */
export const DEFAULT_KEYWORD_RULES: readonly KeywordRule[] = [
  {
    id: 'default-100x',
    kind: 'word',
    pattern: '100x',
    match: 'whole-word',
    category: 'crypto',
    enabled: true,
  },
  {
    id: 'default-presale',
    kind: 'word',
    pattern: 'presale',
    match: 'whole-word',
    category: 'crypto',
    enabled: true,
  },
  {
    id: 'default-bull-run',
    kind: 'phrase',
    pattern: 'bull run',
    match: 'whole-word',
    category: 'crypto',
    enabled: true,
  },
  {
    id: 'default-millionaire',
    kind: 'word',
    pattern: 'millionaire',
    match: 'substring',
    category: 'crypto',
    enabled: true,
  },
  {
    id: 'default-million-maker',
    kind: 'word',
    pattern: 'million-maker',
    match: 'substring',
    category: 'crypto',
    enabled: true,
  },
];
