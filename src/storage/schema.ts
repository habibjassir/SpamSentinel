// Shape of the settings saved in chrome.storage. Zod checks the structure;
// rule semantics come from the core's validateRule, so they live in one place.
import { z } from 'zod';
import { validateRule } from '../core/index.ts';
import type { KeywordRule } from '../core/index.ts';
import { LANGUAGES } from '../i18n/index.ts';

export const RuleSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['word', 'phrase', 'regex']),
    pattern: z.string(),
    match: z.enum(['whole-word', 'substring']),
    minWords: z.number().optional(),
    maxWords: z.number().optional(),
    category: z.string(),
    enabled: z.boolean(),
  })
  .superRefine((rule, ctx) => {
    for (const error of validateRule(rule)) {
      ctx.addIssue({
        code: 'custom',
        path: [error.field],
        message: error.message,
        params: { ruleErrorCode: error.code },
      });
    }
  });

export const SettingsSchema = z
  .object({
    language: z.enum(LANGUAGES),
    keywordsEnabled: z.boolean(),
    /** Learns from keyword matches; finds nothing while keywords are off. */
    campaignsEnabled: z.boolean(),
    rules: z.array(RuleSchema),
    exemptPhrases: z.array(z.string()),
    allowlist: z.array(z.string()),
  })
  .superRefine((settings, ctx) => {
    const seen = new Set<string>();
    settings.rules.forEach((rule, index) => {
      if (seen.has(rule.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rules', index, 'id'],
          message: `Duplicate rule id "${rule.id}".`,
          params: { ruleErrorCode: 'id-duplicate' },
        });
      }
      seen.add(rule.id);
    });
  });

export type Settings = z.infer<typeof SettingsSchema>;

// Compile-time check: a stored rule is a core KeywordRule.
const _ruleIsKeywordRule = (rule: Settings['rules'][number]): KeywordRule => rule;
void _ruleIsKeywordRule;
