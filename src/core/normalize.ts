// Text normalization: makes disguised spellings comparable to plain ones.
// The same function is applied to comment text, rule patterns and exempt
// phrases, so matching stays symmetric. See docs/decisions/0003-text-normalization.md.

/** Zero-width spaces and joiners, soft hyphens, bidi controls, BOM, variation selectors... */
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\p{Cf}]/gu;

/** Combining marks left after canonical decomposition (accents, tildes, etc.). */
const COMBINING_MARKS = /\p{M}/gu;

/** A letter repeated 3 or more times in a row. Digits are excluded on purpose. */
const LONG_LETTER_RUN = /(\p{L})\1{2,}/gu;

const WHITESPACE = /\s+/gu;

/**
 * Cyrillic and Greek letters that look like Latin letters, in both cases.
 * Conservative on purpose: only letters that are near-identical in common fonts.
 */
const LOOK_ALIKES: Readonly<Record<string, string>> = {
  // Cyrillic, lowercase
  а: 'a',
  с: 'c',
  ԁ: 'd',
  е: 'e',
  һ: 'h',
  і: 'i',
  ј: 'j',
  к: 'k',
  ӏ: 'l',
  о: 'o',
  р: 'p',
  ԛ: 'q',
  ѕ: 's',
  у: 'y',
  х: 'x',
  ԝ: 'w',
  // Cyrillic, uppercase
  А: 'A',
  В: 'B',
  С: 'C',
  Е: 'E',
  Н: 'H',
  І: 'I',
  Ј: 'J',
  К: 'K',
  М: 'M',
  О: 'O',
  Р: 'P',
  Ѕ: 'S',
  Т: 'T',
  Х: 'X',
  У: 'Y',
  // Greek, lowercase
  α: 'a',
  ε: 'e',
  ι: 'i',
  κ: 'k',
  ν: 'v',
  ο: 'o',
  ρ: 'p',
  τ: 't',
  υ: 'u',
  χ: 'x',
  // Greek, uppercase
  Α: 'A',
  Β: 'B',
  Ε: 'E',
  Ζ: 'Z',
  Η: 'H',
  Ι: 'I',
  Κ: 'K',
  Μ: 'M',
  Ν: 'N',
  Ο: 'O',
  Ρ: 'P',
  Τ: 'T',
  Υ: 'Y',
  Χ: 'X',
};

const LOOK_ALIKE_PATTERN = new RegExp(`[${Object.keys(LOOK_ALIKES).join('')}]`, 'gu');

const removeDiacritics = (text: string) =>
  text.normalize('NFD').replace(COMBINING_MARKS, '').normalize('NFC');

const mapLookAlikes = (text: string) =>
  text.replace(LOOK_ALIKE_PATTERN, (ch) => LOOK_ALIKES[ch] ?? ch);

const collapseRepeats = (text: string) => text.replace(LONG_LETTER_RUN, '$1$1');

/**
 * Same cleanup as `normalize`, but keeps letter case. The campaign detector
 * needs it to tell capitalized words ("Altorum", "ALT") from ordinary ones.
 *
 * 1. Unicode NFKC (fullwidth letters and ligatures become plain letters)
 * 2. Remove invisible characters
 * 3. Remove accents and other diacritics
 * 4. Map Cyrillic and Greek look-alike letters to Latin
 * 5. Collapse letters repeated 3+ times down to 2 ("freeee" -> "free")
 * 6. Collapse whitespace and trim
 */
export function normalizePreservingCase(text: string): string {
  const cleaned = text.normalize('NFKC').replace(INVISIBLE, '');
  return collapseRepeats(mapLookAlikes(removeDiacritics(cleaned)))
    .replace(WHITESPACE, ' ')
    .trim();
}

/**
 * Normalizes text for matching: `normalizePreservingCase`, then lowercase.
 *
 * Diacritics, look-alikes and repeats are handled again after lowercasing,
 * because lowercasing can create them (Turkish "İ" becomes "i" plus a dot,
 * "FREEee" only becomes a single run once lowercased).
 * The function is idempotent: normalizing twice gives the same result.
 */
export function normalize(text: string): string {
  return collapseRepeats(
    mapLookAlikes(removeDiacritics(normalizePreservingCase(text).toLowerCase())),
  );
}
