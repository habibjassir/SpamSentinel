// Combines every detector into one verdict per comment.
import { detectCampaigns } from './campaign.ts';
import type { CampaignOptions } from './campaign.ts';
import { detectImpersonation } from './impersonation.ts';
import type { Channel, ImpersonationOptions } from './impersonation.ts';
import { evaluateKeywords } from './keywords.ts';
import { normalize } from './normalize.ts';
import type { CompiledRule } from './rules.ts';
import type { Comment, Reason, Verdict } from './types.ts';

export interface EvaluationSettings {
  keywordsEnabled: boolean;
  /**
   * The campaign detector learns from keyword-flagged comments, so with
   * keywords disabled it has no seeds and flags nothing.
   */
  campaignsEnabled: boolean;
  /** A comment containing any of these is never flagged, by any detector. */
  exemptPhrases: readonly string[];
  /** Names that never become campaign terms, e.g. "Bitcoin". */
  allowlist: readonly string[];
  campaign: CampaignOptions;
  /** Authors whose handle copies the video's channel. Needs `channel`. */
  impersonationEnabled: boolean;
  /** The video's channel, read from the page; `null` when unknown. */
  channel: Channel | null;
  impersonation: ImpersonationOptions;
}

const notFlagged = (): Verdict => ({ flagged: false, reasons: [] });

/**
 * Evaluates every comment loaded so far and returns one verdict per comment,
 * in input order, keeping all reasons from all enabled detectors.
 */
export function evaluateAll(
  comments: readonly Comment[],
  rules: readonly CompiledRule[],
  settings: EvaluationSettings,
): Verdict[] {
  const keywordVerdicts = comments.map((comment) =>
    settings.keywordsEnabled
      ? evaluateKeywords(comment, rules, settings.exemptPhrases)
      : notFlagged(),
  );
  const campaign = settings.campaignsEnabled
    ? detectCampaigns(comments, keywordVerdicts, settings.allowlist, settings.campaign).verdicts
    : null;
  const impersonation =
    settings.impersonationEnabled && settings.channel
      ? detectImpersonation(comments, settings.channel, settings.impersonation)
      : null;
  if (!campaign && !impersonation) return keywordVerdicts;

  const exempt = settings.exemptPhrases.map(normalize).filter((phrase) => phrase !== '');

  return comments.map((comment, i) => {
    const keyword = keywordVerdicts[i]!;
    const extra: Reason[] = [
      ...(campaign?.[i]?.reasons ?? []),
      ...(impersonation?.[i]?.reasons ?? []),
    ];
    if (extra.length === 0) return keyword;

    // Exempt comments are never flagged, by any detector (keywords already check this).
    if (exempt.length > 0) {
      const text = normalize(comment.text);
      if (exempt.some((phrase) => text.includes(phrase))) return notFlagged();
    }
    return { flagged: true, reasons: [...keyword.reasons, ...extra] };
  });
}
