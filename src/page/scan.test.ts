import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { messages } from '../i18n/index.ts';
import { defaultSettings } from '../storage/defaults.ts';
import {
  HIGHLIGHT_ATTRIBUTE,
  LABEL_ATTRIBUTE,
  clearHighlights,
  formatReason,
} from './highlighter.ts';
import { readComments } from './reader.ts';
import { scanPage } from './scan.ts';

// Paths come from the project root: in the happy-dom environment `URL` is the simulated browser's.
const fromRoot = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const sampleHtml = fromRoot('fixtures/page-WkKhJx0Rz1I.html');
const fixture = JSON.parse(fromRoot('fixtures/comments-WkKhJx0Rz1I.public.json')) as {
  comments: { label: 'spam' | 'legit'; text: string }[];
};

/** Same comparison basis as the reader tests: the JSON fixture lacks emoji drawn as images. */
const comparable = (text: string) =>
  text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
const labelOf = new Map(fixture.comments.map((c) => [comparable(c.text), c.label]));

let doc: Document;
beforeEach(() => {
  doc = new DOMParser().parseFromString(sampleHtml, 'text/html');
});

const labels = () => [...doc.querySelectorAll(`[${LABEL_ATTRIBUTE}]`)];

describe('scanPage on the sample page', () => {
  it('flags 16 of 68 comments with the default settings', () => {
    expect(scanPage(doc, defaultSettings('en'))).toEqual({ total: 68, flagged: 16 });
  });

  it('flags only spam: every highlighted comment is labeled spam in the JSON fixture', () => {
    scanPage(doc, defaultSettings('en'));
    const flagged = readComments(doc).filter(({ element }) =>
      element.querySelector(`[${HIGHLIGHT_ATTRIBUTE}]`),
    );
    expect(flagged).toHaveLength(16);
    for (const { comment } of flagged) expect(labelOf.get(comparable(comment.text))).toBe('spam');
  });

  it('adds one border and one label per flagged comment', () => {
    scanPage(doc, defaultSettings('en'));
    expect(doc.querySelectorAll(`[${HIGHLIGHT_ATTRIBUTE}]`)).toHaveLength(16);
    expect(labels()).toHaveLength(16);
  });

  it('lists every reason in the label', () => {
    scanPage(doc, defaultSettings('en'));
    const both = labels().find((l) => l.textContent?.includes('Rule: presale'));
    expect(both?.textContent).toMatch(/^Possible spam: /);
    // 9 seeds on the sample page (68 comments); the JSON fixture (75 comments) has 13.
    expect(both?.textContent).toContain('Mentions Altorum, promoted in 9 flagged comments');
  });

  it('writes labels in Spanish when the interface is in Spanish', () => {
    scanPage(doc, defaultSettings('es'));
    expect(labels()[0]?.textContent).toMatch(/^Posible spam: /);
    expect(labels().some((l) => l.textContent?.includes('Menciona Altorum'))).toBe(true);
  });

  it('gives the same result when scanning twice, without duplicated labels', () => {
    const first = scanPage(doc, defaultSettings('en'));
    const second = scanPage(doc, defaultSettings('en'));
    expect(second).toEqual(first);
    expect(labels()).toHaveLength(16);
  });

  it('never reads its own labels as comment text', () => {
    const before = readComments(doc).map((r) => r.comment.text);
    scanPage(doc, defaultSettings('en'));
    expect(readComments(doc).map((r) => r.comment.text)).toEqual(before);
  });

  it('applies the settings: with keyword rules off nothing is flagged', () => {
    const settings = { ...defaultSettings('en'), keywordsEnabled: false };
    expect(scanPage(doc, settings)).toEqual({ total: 68, flagged: 0 });
    expect(labels()).toHaveLength(0);
  });

  it('removes earlier highlights when a new scan flags fewer comments', () => {
    scanPage(doc, defaultSettings('en'));
    scanPage(doc, { ...defaultSettings('en'), keywordsEnabled: false });
    expect(doc.querySelectorAll(`[${HIGHLIGHT_ATTRIBUTE}]`)).toHaveLength(0);
  });
});

describe('clearHighlights', () => {
  it('removes every border, label and inline style it added', () => {
    const untouched = doc.body.innerHTML;
    scanPage(doc, defaultSettings('en'));
    clearHighlights(doc);
    expect(doc.body.innerHTML).toBe(untouched);
  });
});

describe('formatReason', () => {
  const keyword = {
    detector: 'keyword' as const,
    ruleId: 'r',
    category: 'crypto',
    pattern: 'presale',
  };
  const campaign = {
    detector: 'campaign' as const,
    term: 'Altorum',
    seedCount: 13,
    authorCount: 13,
  };

  it('describes keyword and campaign reasons in both languages', () => {
    expect(formatReason(keyword, messages.en)).toBe('Rule: presale (crypto)');
    expect(formatReason(keyword, messages.es)).toBe('Regla: presale (crypto)');
    expect(formatReason(campaign, messages.en)).toBe(
      'Mentions Altorum, promoted in 13 flagged comments',
    );
    expect(formatReason(campaign, messages.es)).toBe(
      'Menciona Altorum, promovido en 13 comentarios marcados',
    );
  });

  it('leaves out an empty category', () => {
    expect(formatReason({ ...keyword, category: '' }, messages.en)).toBe('Rule: presale');
  });
});
