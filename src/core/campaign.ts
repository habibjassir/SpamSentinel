// Repeated-campaign detector: learns the name of a promoted token from comments
// already flagged by keyword rules (the seeds), then flags every comment that
// mentions it. See docs/design.md, "Cómo funciona la campaña repetida".
import { normalize, normalizePreservingCase } from './normalize.ts';
import type { CampaignReason, Comment, Verdict } from './types.ts';

/** Thresholds are configuration, not constants: they will be tuned with more samples. */
export interface CampaignOptions {
  /** Different authors whose seeds must mention a term before it becomes a campaign term. */
  minSeeds: number;
  /** Shortest candidate word, in characters. */
  minTermLength: number;
  /** Terms this long or shorter (e.g. "ALT") only match the exact form seen in seeds. */
  caseSensitiveMaxLength: number;
}

export interface CampaignTerm {
  /** Normalized key, e.g. "altorum". */
  term: string;
  /** Most frequent form in the seeds, e.g. "Altorum". */
  display: string;
  /** Every form seen in the seeds, sorted. */
  forms: string[];
  seedCount: number;
  authorCount: number;
}

export interface CampaignResult {
  /** Campaign terms, sorted by `term`. */
  terms: CampaignTerm[];
  /** One verdict per comment, in input order, with campaign reasons only. */
  verdicts: Verdict<CampaignReason>[];
}

const WORD = /[\p{L}\p{N}]+/gu;
const SENTENCE_END = /[.!?…]/u;
const LINE_BREAK = /\r\n|[\n\r\u2028\u2029]/u;
const STARTS_UPPERCASE = /^\p{Lu}/u;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wholeWord = (body: string, flags: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(body)}(?![\\p{L}\\p{N}])`, flags);

function candidatesIn(text: string, allowed: ReadonlySet<string>, minLength: number): string[] {
  const candidates: string[] = [];

  // Every line starts a new sentence; normalization would merge lines, so split first.
  for (const line of text.split(LINE_BREAK)) {
    const clean = normalizePreservingCase(line);
    let sentenceStart = true;
    let previousEnd = 0;

    for (const match of clean.matchAll(WORD)) {
      const word = match[0];
      if (SENTENCE_END.test(clean.slice(previousEnd, match.index))) sentenceStart = true;

      if (
        !sentenceStart &&
        word.length >= minLength &&
        STARTS_UPPERCASE.test(word) &&
        !allowed.has(normalize(word))
      ) {
        candidates.push(word);
      }
      sentenceStart = false;
      previousEnd = match.index + word.length;
    }
  }
  return candidates;
}

const toAllowedSet = (allowlist: readonly string[]) =>
  new Set(allowlist.map(normalize).filter((name) => name !== ''));

/**
 * Candidate campaign terms in a text: words that start with an uppercase letter,
 * have at least `minLength` characters, do not start a sentence, and are not in
 * the allowlist (compared in any letter case).
 */
export function extractCandidates(
  text: string,
  allowlist: readonly string[],
  minLength = 3,
): string[] {
  return candidatesIn(text, toAllowedSet(allowlist), minLength);
}

interface TermStats {
  seeds: number;
  authors: Set<string>;
  forms: Map<string, number>;
}

function mostFrequent(forms: Map<string, number>): string {
  let best = '';
  let bestCount = -1;
  for (const [form, count] of forms) {
    if (count > bestCount || (count === bestCount && form < best)) {
      best = form;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Learns campaign terms from the keyword-flagged comments and flags every
 * comment that mentions one of them.
 *
 * The result depends only on the set of comments, not on their order or on
 * earlier calls, so it can be called again as YouTube loads more comments.
 */
export function detectCampaigns(
  comments: readonly Comment[],
  keywordVerdicts: readonly Verdict[],
  allowlist: readonly string[],
  options: CampaignOptions,
): CampaignResult {
  if (comments.length !== keywordVerdicts.length) {
    throw new Error('comments and keywordVerdicts must have the same length');
  }

  // 1-3. Collect candidates from seeds and keep terms backed by enough authors.
  const allowed = toAllowedSet(allowlist);
  const stats = new Map<string, TermStats>();

  comments.forEach((comment, i) => {
    if (!keywordVerdicts[i]?.flagged) return;

    const formsInSeed = new Map<string, Set<string>>();
    for (const word of candidatesIn(comment.text, allowed, options.minTermLength)) {
      const key = normalize(word);
      if (!formsInSeed.has(key)) formsInSeed.set(key, new Set());
      formsInSeed.get(key)!.add(word);
    }

    for (const [key, forms] of formsInSeed) {
      let entry = stats.get(key);
      if (!entry) {
        entry = { seeds: 0, authors: new Set(), forms: new Map() };
        stats.set(key, entry);
      }
      entry.seeds += 1;
      entry.authors.add(comment.author);
      for (const form of forms) entry.forms.set(form, (entry.forms.get(form) ?? 0) + 1);
    }
  });

  const terms: CampaignTerm[] = [...stats]
    .filter(([, entry]) => entry.authors.size >= options.minSeeds)
    .map(([term, entry]) => ({
      term,
      display: mostFrequent(entry.forms),
      forms: [...entry.forms.keys()].sort(),
      seedCount: entry.seeds,
      authorCount: entry.authors.size,
    }))
    .sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));

  // 4. Flag every comment that mentions a campaign term as a whole word.
  const matchers = terms.map((term) => {
    const caseSensitive = term.term.length <= options.caseSensitiveMaxLength;
    const reason: CampaignReason = {
      detector: 'campaign',
      term: term.display,
      seedCount: term.seedCount,
      authorCount: term.authorCount,
    };
    return caseSensitive
      ? { caseSensitive, regexes: term.forms.map((form) => wholeWord(form, 'u')), reason }
      : { caseSensitive, regexes: [wholeWord(term.term, 'u')], reason };
  });

  const verdicts = comments.map((comment): Verdict<CampaignReason> => {
    if (matchers.length === 0) return { flagged: false, reasons: [] };
    const folded = normalize(comment.text);
    const cased = normalizePreservingCase(comment.text);
    const reasons = matchers
      .filter(({ caseSensitive, regexes }) =>
        regexes.some((regex) => regex.test(caseSensitive ? cased : folded)),
      )
      .map(({ reason }) => ({ ...reason }));
    return { flagged: reasons.length > 0, reasons };
  });

  return { terms, verdicts };
}
