import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findCommentsSection, readComments, readVideoOwner } from './reader.ts';
import type { ReadComment } from './reader.ts';
import { SELECTORS } from './selectors.ts';

// Captured, pseudonymized comment section of the same video as the JSON fixture.
// Paths come from the project root: in the happy-dom environment `URL` is the simulated browser's.
const fromRoot = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const sampleHtml = fromRoot('fixtures/page-WkKhJx0Rz1I.html');
const fixture = JSON.parse(fromRoot('fixtures/comments-WkKhJx0Rz1I.public.json')) as {
  comments: { author: string; reply: boolean; text: string }[];
};

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const sample = parse(sampleHtml);
const read = readComments(sample);

/** The top-level thread a read comment belongs to. */
const topThreadOf = (item: ReadComment) => {
  let thread = item.element;
  for (
    let up = thread.parentElement?.closest(SELECTORS.thread);
    up;
    up = up.parentElement?.closest(SELECTORS.thread)
  ) {
    thread = up;
  }
  return thread;
};

/**
 * The JSON fixture was saved from the visible text: emoji drawn as images are
 * missing and non-breaking spaces became spaces. Compare on that basis.
 */
const asInFixture = (text: string) =>
  text
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '')
    .replace(/\u00A0/g, ' ')
    .trim();

describe('readComments on the sample page', () => {
  const topLevelInSample = sample.querySelectorAll(
    `${SELECTORS.thread}:not([is-sub-thread])`,
  ).length;
  const repliesInSample = sample.querySelectorAll(`${SELECTORS.thread}[is-sub-thread]`).length;

  it('reads every top-level comment and every loaded reply', () => {
    expect(topLevelInSample).toBe(46);
    expect(repliesInSample).toBe(22);
    expect(read.filter((r) => !r.comment.isReply)).toHaveLength(topLevelInSample);
    expect(read.filter((r) => r.comment.isReply)).toHaveLength(repliesInSample);
  });

  it('marks replies and lists them right after their parent thread', () => {
    const order = read.map(topThreadOf);
    read.forEach((item, i) => {
      if (item.comment.isReply) {
        // Same top-level thread as the comment before it: replies never jump threads.
        expect(order[i]).toBe(order[i - 1]);
      } else {
        // A top-level comment starts its own thread.
        expect(order[i]).toBe(item.element);
      }
    });
  });

  it('reads nested replies (a reply to a reply) as replies', () => {
    const nested = read.find((r) => r.comment.text.includes('Si nota que Salo compra en DCA'));
    expect(nested?.comment.isReply).toBe(true);
  });

  it('matches the JSON fixture in text, author and reply status', () => {
    const byText = new Map(fixture.comments.map((c) => [asInFixture(c.text), c]));
    const matched = read.filter((r) => byText.has(asInFixture(r.comment.text)));
    expect(matched.length).toBeGreaterThanOrEqual(55);
    for (const { comment } of matched) {
      const expected = byText.get(asInFixture(comment.text))!;
      expect({ author: comment.author, isReply: comment.isReply }).toEqual({
        author: expected.author,
        isReply: expected.reply,
      });
    }
  });

  it('keeps line breaks and emoji, without surrounding whitespace', () => {
    for (const { comment } of read) expect(comment.text).toBe(comment.text.trim());

    const multiline = read.find((r) => r.comment.text.startsWith('Cada vez que dices'));
    expect(multiline?.comment.text).toContain('VENDO. \n\nEres muy bueno');

    // An emoji typed as a character, and emoji YouTube draws as images (read from alt).
    expect(read.some((r) => r.comment.text.endsWith('mis hijos\u{1F979}'))).toBe(true);
    expect(read.find((r) => r.comment.text.startsWith('Agradecido'))?.comment.text).toBe(
      'Agradecido contigo siempre\u{1FAC2}\u{1F4AA}\u{1F64F}',
    );
  });

  it('reads author handles from the author link', () => {
    for (const { comment } of read) expect(comment.author).toMatch(/^@autor\d+$/);
  });

  it('does not invent replies for a collapsed thread', () => {
    const i = read.findIndex((r) => r.comment.text.startsWith('Error invertir en acciones'));
    expect(i).toBeGreaterThan(-1);
    expect(read[i + 1]?.comment.isReply).toBe(false);
  });

  it('returns each comment with its element, for highlighting later', () => {
    for (const { element } of read) expect(element.matches(SELECTORS.thread)).toBe(true);
  });
});

describe('readVideoOwner', () => {
  it('returns the channel handle from the owner link', () => {
    expect(readVideoOwner(sample)).toBe('@Alejandrosalomondrin');
  });

  it('returns null when the owner link is missing', () => {
    expect(readVideoOwner(parse('<p>no owner</p>'))).toBeNull();
  });
});

describe('a page whose structure changed', () => {
  const changed = parse('<main><div class="comments"><p>Great video</p></div></main>');

  it('has no comments section', () => {
    expect(findCommentsSection(changed)).toBeNull();
    expect(findCommentsSection(sample)).not.toBeNull();
  });

  it('reads no comments and does not throw', () => {
    expect(readComments(changed)).toEqual([]);
  });

  it('skips a thread without text instead of failing', () => {
    const broken = parse(
      `<ytd-comment-thread-renderer><div id="comment-container"></div></ytd-comment-thread-renderer>`,
    );
    expect(readComments(broken)).toEqual([]);
  });
});

describe('the sample page', () => {
  it('contains no real usernames: every handle is a pseudonym or the channel', () => {
    const handles = new Set(sampleHtml.match(/@[\p{L}\p{N}._-]+/gu) ?? []);
    for (const handle of handles) {
      expect(handle).toMatch(/^(@autor\d+|@Alejandrosalomondrin)$/);
    }
  });

  it('contains no scripts', () => {
    expect(sampleHtml).not.toMatch(/<script/i);
  });
});
