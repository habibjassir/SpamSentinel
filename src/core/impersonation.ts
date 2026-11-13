// Channel impersonation detector: authors whose handle copies the video's
// channel. Not validated with real cases yet (see impersonation.test.ts).
import { normalize } from './normalize.ts';
import type { Comment, ImpersonationReason, Verdict } from './types.ts';

/** The video's channel, read from the page. */
export interface Channel {
  /** e.g. "@channel"; the real channel is recognized by this exact handle. */
  handle: string;
  /** Display name, e.g. "Channel Name", when the page shows it. */
  name: string | null;
}

/** Thresholds are configuration, not constants: tune them when real cases appear. */
export interface ImpersonationOptions {
  /** Edits allowed for a "near-identical" handle (flagged on its own). */
  nearMaxEdits: number;
  /** Shortest channel key for which `nearMaxEdits` applies; shorter keys need an exact match. */
  minNearLength: number;
  /** Edits allowed for a "similar" handle (flagged only with a contact request). */
  similarMaxEdits: number;
  /** Shortest name part that counts when one handle contains the other. */
  minContainLength: number;
  /** Endings removed from handles before comparing, e.g. "official", "tv". */
  suffixes: readonly string[];
  /** Regular expressions (run on normalized text) that mean "contact me". */
  contactPatterns: readonly string[];
}

const SEPARATORS = /[\s._-]+/g;
const TRAILING_DIGITS = /\d+$/;

/**
 * Comparable core of a handle or name: no "@", lowercase, normalized, without
 * separators, trailing digits or common suffixes ("@Salomon.Oficial_99" -> "salomon").
 */
export function handleCore(handle: string, suffixes: readonly string[]): string {
  let core = normalize(handle.replace(/^@/, ''))
    .replace(SEPARATORS, '')
    .replace(TRAILING_DIGITS, '');
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (core.endsWith(suffix) && core.length - suffix.length >= 3) {
        core = core.slice(0, -suffix.length).replace(TRAILING_DIGITS, '');
        changed = true;
      }
    }
  }
  return core;
}

/** Levenshtein distance, giving up (returning `max + 1`) once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length]!;
}

/** True when the text asks readers to get in touch (messaging apps, phone numbers…). */
export function asksForContact(text: string, patterns: readonly string[]): boolean {
  const normalized = normalize(text);
  return patterns.some((pattern) => new RegExp(pattern, 'u').test(normalized));
}

/**
 * Flags comments whose author's handle copies the channel's:
 * - near-identical handle: flagged on its own;
 * - similar handle: flagged only if the comment also asks for contact.
 * The real channel (exact handle, any letter case) is never flagged.
 */
export function detectImpersonation(
  comments: readonly Comment[],
  channel: Channel | null,
  options: ImpersonationOptions,
): Verdict<ImpersonationReason>[] {
  const none = (): Verdict<ImpersonationReason> => ({ flagged: false, reasons: [] });
  if (!channel?.handle) return comments.map(none);

  const ownHandle = channel.handle.toLowerCase();
  const fullKeys = [
    ...new Set(
      [channel.handle, channel.name ?? '']
        .map((value) => handleCore(value, options.suffixes))
        .filter((key) => key !== ''),
    ),
  ];
  const nameParts = normalize(channel.name ?? '')
    .split(/\s+/)
    .filter((part) => part.length >= options.minContainLength);
  const contactRegexes = options.contactPatterns.map((pattern) => new RegExp(pattern, 'u'));

  return comments.map((comment) => {
    if (comment.author.toLowerCase() === ownHandle) return none();
    const core = handleCore(comment.author, options.suffixes);
    if (core === '') return none();

    const near = fullKeys.some(
      (key) =>
        core === key ||
        (key.length >= options.minNearLength &&
          editDistance(core, key, options.nearMaxEdits) <= options.nearMaxEdits),
    );
    const similar =
      near ||
      fullKeys.some(
        (key) =>
          editDistance(core, key, options.similarMaxEdits) <= options.similarMaxEdits ||
          (key.length >= options.minContainLength && core.includes(key)) ||
          (core.length >= options.minContainLength && key.includes(core)),
      ) ||
      nameParts.some((part) => core.includes(part));

    const text = normalize(comment.text);
    const contact = contactRegexes.some((regex) => regex.test(text));
    if (!near && !(similar && contact)) return none();

    return {
      flagged: true,
      reasons: [
        { detector: 'impersonation', author: comment.author, channel: channel.handle, contact },
      ],
    };
  });
}
