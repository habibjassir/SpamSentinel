// Keyword detector: one matching rule is enough to flag a comment.
// No weights, no scores (docs/design.md, "Motor de reglas").
import { normalize } from './normalize.ts';
import type { CompiledRule } from './rules.ts';
import type { Comment, KeywordReason, Verdict } from './types.ts';
import { countWords } from './words.ts';

/**
 * Decides whether a comment matches the user's keyword rules and says which ones.
 *
 * - Rules must come from `compileRules`, so patterns are compiled only once.
 * - A comment containing any exempt phrase is never flagged.
 * - A rule with `minWords` / `maxWords` only applies when the comment's word
 *   count is within those limits.
 */
export function evaluateKeywords(
  comment: Comment,
  rules: readonly CompiledRule[],
  exemptPhrases: readonly string[],
): Verdict {
  const text = normalize(comment.text);

  for (const phrase of exemptPhrases) {
    const exempt = normalize(phrase);
    if (exempt !== '' && text.includes(exempt)) return { flagged: false, reasons: [] };
  }

  let wordCount: number | undefined;
  const reasons: KeywordReason[] = [];

  for (const { rule, regex } of rules) {
    if (!regex.test(text)) continue;

    if (rule.minWords !== undefined || rule.maxWords !== undefined) {
      wordCount ??= countWords(text);
      if (rule.minWords !== undefined && wordCount < rule.minWords) continue;
      if (rule.maxWords !== undefined && wordCount > rule.maxWords) continue;
    }

    reasons.push({
      detector: 'keyword',
      ruleId: rule.id,
      category: rule.category,
      pattern: rule.pattern,
    });
  }

  return { flagged: reasons.length > 0, reasons };
}
