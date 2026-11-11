const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/**
 * Counts the words in a text. A word is a whitespace-separated token that
 * contains at least one letter or digit, so dashes, emoji and "!!!" do not count.
 */
export function countWords(text: string): number {
  return text.split(/\s+/u).filter((token) => HAS_LETTER_OR_DIGIT.test(token)).length;
}
