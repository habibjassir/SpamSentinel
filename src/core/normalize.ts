// Text normalization: makes disguised spellings comparable to plain ones.
// The same function is applied to comment text, rule patterns and exempt
// phrases, so matching stays symmetric.

/** Zero-width spaces and joiners, soft hyphens, bidi controls, BOM, variation selectors... */
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\p{Cf}]/gu;

/** Combining marks left after canonical decomposition (accents, tildes, etc.). */
const COMBINING_MARKS = /\p{M}/gu;

/** A letter repeated 3 or more times in a row. Digits are excluded on purpose. */
const LONG_LETTER_RUN = /(\p{L})\1{2,}/gu;

const WHITESPACE = /\s+/gu;

/**
 * Lowercase Cyrillic and Greek letters that look like Latin letters.
 * Conservative on purpose: only letters that are near-identical in common fonts.
 */
const LOOK_ALIKES: Readonly<Record<string, string>> = {
  // Cyrillic
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
  // Greek
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
};

const LOOK_ALIKE_PATTERN = new RegExp(`[${Object.keys(LOOK_ALIKES).join('')}]`, 'gu');

/**
 * Normalizes text for matching:
 * 1. Unicode NFKC (fullwidth letters and ligatures become plain letters)
 * 2. Remove invisible characters
 * 3. Lowercase
 * 4. Remove accents and other diacritics
 * 5. Map Cyrillic and Greek look-alike letters to Latin
 * 6. Collapse letters repeated 3+ times down to 2 ("freeee" -> "free")
 * 7. Collapse whitespace and trim
 *
 * The function is idempotent: normalizing twice gives the same result.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .normalize('NFC')
    .replace(LOOK_ALIKE_PATTERN, (ch) => LOOK_ALIKES[ch] ?? ch)
    .replace(LONG_LETTER_RUN, '$1$1')
    .replace(WHITESPACE, ' ')
    .trim();
}
