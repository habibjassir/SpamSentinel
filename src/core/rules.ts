// Rule validation and compilation. Patterns are turned into RegExp objects once,
// when rules are saved or loaded, never on every evaluation.
import { normalize } from './normalize.ts';
import type { KeywordRule } from './types.ts';

/** Longest regex a user may save. Keeps badly written patterns from freezing the page. */
export const MAX_REGEX_LENGTH = 200;

/** Stable identifiers for validation errors, so a UI can translate them. */
export type RuleErrorCode =
  | 'id-empty'
  | 'id-duplicate'
  | 'pattern-empty'
  | 'word-has-spaces'
  | 'regex-invalid'
  | 'regex-too-long'
  | 'regex-matches-empty'
  | 'min-words-invalid'
  | 'max-words-invalid'
  | 'words-range';

export interface RuleError {
  ruleId: string;
  field: 'id' | 'pattern' | 'minWords' | 'maxWords';
  code: RuleErrorCode;
  /** English description, for logs and tests. UIs should translate `code` instead. */
  message: string;
}

export interface CompiledRule {
  rule: KeywordRule;
  /** Tested against normalized comment text. Never uses the `g` flag (no shared state). */
  regex: RegExp;
}

export interface CompiledRules {
  /** Enabled, valid rules ready for evaluation. */
  rules: CompiledRule[];
  /** Problems found in any rule, enabled or not. */
  errors: RuleError[];
}

/** No letter or digit right before / after the pattern. Unicode-aware, unlike `\b`. */
const WORD_START = '(?<![\\p{L}\\p{N}])';
const WORD_END = '(?![\\p{L}\\p{N}])';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type BuildResult = { regex: RegExp } | { error: RuleError };

function buildRegex(rule: KeywordRule): BuildResult {
  const patternError = (code: RuleErrorCode, message: string): BuildResult => ({
    error: { ruleId: rule.id, field: 'pattern', code, message },
  });

  if (rule.kind === 'regex') {
    if (rule.pattern.trim() === '') return patternError('pattern-empty', 'Pattern is empty.');
    if (rule.pattern.length > MAX_REGEX_LENGTH) {
      return patternError(
        'regex-too-long',
        `Regular expression is too long: ${rule.pattern.length} characters, the limit is ${MAX_REGEX_LENGTH} characters.`,
      );
    }
    let regex: RegExp;
    try {
      regex = new RegExp(rule.pattern, 'iu');
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return patternError(
        'regex-invalid',
        detail.startsWith('Invalid regular expression')
          ? `${detail}.`
          : `Invalid regular expression: ${detail}.`,
      );
    }
    if (regex.test('')) {
      return patternError(
        'regex-matches-empty',
        'Regular expression matches empty text, so it would flag every comment.',
      );
    }
    return { regex };
  }

  const pattern = normalize(rule.pattern);
  if (pattern === '') return patternError('pattern-empty', 'Pattern is empty.');
  if (rule.kind === 'word' && pattern.includes(' ')) {
    return patternError(
      'word-has-spaces',
      'A word rule must be a single word. Use a phrase rule instead.',
    );
  }
  const body = escapeRegExp(pattern);
  const source = rule.match === 'whole-word' ? `${WORD_START}${body}${WORD_END}` : body;
  return { regex: new RegExp(source, 'u') };
}

function validateWordLimits(rule: KeywordRule): RuleError[] {
  const errors: RuleError[] = [];
  const isCount = (n: number) => Number.isInteger(n) && n >= 0;

  if (rule.minWords !== undefined && !isCount(rule.minWords)) {
    errors.push({
      ruleId: rule.id,
      field: 'minWords',
      code: 'min-words-invalid',
      message: 'Minimum words must be a whole number of 0 or more.',
    });
  }
  if (rule.maxWords !== undefined && !isCount(rule.maxWords)) {
    errors.push({
      ruleId: rule.id,
      field: 'maxWords',
      code: 'max-words-invalid',
      message: 'Maximum words must be a whole number of 0 or more.',
    });
  }
  if (
    errors.length === 0 &&
    rule.minWords !== undefined &&
    rule.maxWords !== undefined &&
    rule.maxWords < rule.minWords
  ) {
    errors.push({
      ruleId: rule.id,
      field: 'maxWords',
      code: 'words-range',
      message: 'Maximum words cannot be lower than minimum words.',
    });
  }
  return errors;
}

/** Returns every problem in a rule; an empty list means the rule is valid. */
export function validateRule(rule: KeywordRule): RuleError[] {
  const errors: RuleError[] = [];
  if (rule.id.trim() === '') {
    errors.push({ ruleId: rule.id, field: 'id', code: 'id-empty', message: 'Rule id is empty.' });
  }
  const built = buildRegex(rule);
  if ('error' in built) errors.push(built.error);
  errors.push(...validateWordLimits(rule));
  return errors;
}

/**
 * Validates every rule and compiles the enabled, valid ones.
 * Disabled rules are validated too, so the options page can show their errors.
 */
export function compileRules(rules: readonly KeywordRule[]): CompiledRules {
  const compiled: CompiledRule[] = [];
  const errors: RuleError[] = [];
  const seenIds = new Set<string>();

  for (const rule of rules) {
    const ruleErrors = validateRule(rule);
    if (seenIds.has(rule.id)) {
      ruleErrors.push({
        ruleId: rule.id,
        field: 'id',
        code: 'id-duplicate',
        message: `Duplicate rule id "${rule.id}".`,
      });
    }
    seenIds.add(rule.id);

    if (ruleErrors.length > 0) {
      errors.push(...ruleErrors);
      continue;
    }
    const built = buildRegex(rule);
    if (rule.enabled && 'regex' in built) compiled.push({ rule, regex: built.regex });
  }

  return { rules: compiled, errors };
}
