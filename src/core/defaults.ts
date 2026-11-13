import type { CampaignOptions } from './campaign.ts';
import type { ImpersonationOptions } from './impersonation.ts';
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

/**
 * Names that never become campaign terms (compared in any letter case).
 * Users can edit this list.
 */
export const DEFAULT_ALLOWLIST: readonly string[] = [
  'Bitcoin',
  'BTC',
  'Ethereum',
  'ETH',
  'Solana',
  'SOL',
];

/** Starting thresholds; to be tuned with more samples (docs/design.md). */
export const DEFAULT_CAMPAIGN_OPTIONS: CampaignOptions = {
  minSeeds: 3,
  minTermLength: 3,
  caseSensitiveMaxLength: 4,
};

/**
 * Starting values for the impersonation detector. Not validated with real
 * cases yet; tune them when real impersonation comments are collected.
 * Contact patterns run on normalized text (lowercase, no accents).
 */
export const DEFAULT_IMPERSONATION_OPTIONS: ImpersonationOptions = {
  nearMaxEdits: 1,
  minNearLength: 6,
  similarMaxEdits: 2,
  minContainLength: 5,
  suffixes: [
    'official',
    'oficial',
    'ofc',
    'real',
    'tv',
    'team',
    'support',
    'soporte',
    'channel',
    'canal',
  ],
  contactPatterns: [
    'whats\\s?app',
    '\\bwsp\\b',
    'wa\\.me',
    'telegram',
    '\\bt\\.me\\/',
    'escribeme',
    'escribime',
    'escribanme',
    'contactame',
    'contact me',
    'write to me',
    'text me',
    'dm me',
    'message me',
    '\\+\\d[\\d\\s().-]{7,}\\d',
    '\\b\\d{10,}\\b',
  ],
};
