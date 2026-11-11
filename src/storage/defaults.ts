import { DEFAULT_ALLOWLIST, DEFAULT_KEYWORD_RULES } from '../core/index.ts';
import type { Language } from '../i18n/index.ts';
import { SCAN_DELAY_DEFAULT_MS } from './schema.ts';
import type { Settings } from './schema.ts';

/** First-run settings. Returns fresh copies, so callers may edit the result freely. */
export function defaultSettings(language: Language): Settings {
  return {
    language,
    keywordsEnabled: true,
    campaignsEnabled: true,
    rules: DEFAULT_KEYWORD_RULES.map((rule) => ({ ...rule })),
    exemptPhrases: [],
    allowlist: [...DEFAULT_ALLOWLIST],
    autoScan: true,
    scanDelayMs: SCAN_DELAY_DEFAULT_MS,
  };
}
