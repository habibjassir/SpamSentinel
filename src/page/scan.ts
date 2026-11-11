// One scan: read the loaded comments, evaluate them with the saved settings,
// and highlight the suspicious ones.
import { DEFAULT_CAMPAIGN_OPTIONS, compileRules, evaluateAll } from '../core/index.ts';
import type { EvaluationSettings } from '../core/index.ts';
import { messages } from '../i18n/index.ts';
import type { Settings } from '../storage/index.ts';
import { clearHighlights, highlight } from './highlighter.ts';
import { readComments } from './reader.ts';

export interface ScanResult {
  /** Comments and replies read from the page. */
  total: number;
  /** How many of them were highlighted. */
  flagged: number;
}

/** Maps saved settings to what the core needs. Campaign thresholds are not user-editable yet. */
export function toEvaluationSettings(settings: Settings): EvaluationSettings {
  return {
    keywordsEnabled: settings.keywordsEnabled,
    campaignsEnabled: settings.campaignsEnabled,
    exemptPhrases: settings.exemptPhrases,
    allowlist: settings.allowlist,
    campaign: DEFAULT_CAMPAIGN_OPTIONS,
  };
}

/** Clears earlier highlights, then scans every comment loaded under `root`. */
export function scanPage(root: ParentNode, settings: Settings): ScanResult {
  clearHighlights(root);

  const read = readComments(root);
  const { rules } = compileRules(settings.rules);
  const verdicts = evaluateAll(
    read.map((r) => r.comment),
    rules,
    toEvaluationSettings(settings),
  );

  const t = messages[settings.language];
  let flagged = 0;
  verdicts.forEach((verdict, i) => {
    if (!verdict.flagged) return;
    highlight(read[i]!.element, verdict.reasons, t);
    flagged += 1;
  });

  return { total: read.length, flagged };
}
