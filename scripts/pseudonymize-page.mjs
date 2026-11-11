// @ts-check
// Turns a raw capture of a YouTube comment section into the public sample page.
//
//   node scripts/pseudonymize-page.mjs <raw.html> <out.html> [--captured YYYY-MM-DD]
//
// - Every commenter handle (author links and @mentions) is replaced with the
//   pseudonym that author already has in fixtures/comments-WkKhJx0Rz1I.public.json,
//   matched by comment text. Authors not in that fixture get new @autorNN numbers.
// - /channel/<id> links are replaced with placeholder ids.
// - The video owner's handle is kept: it is the public channel.
// - The HTML is edited as text, not re-serialized, so YouTube's structure is kept as captured.
// Raw captures contain real usernames: keep them as fixtures/*.private.html (git-ignored).
import { readFileSync, writeFileSync } from 'node:fs';
import { Window } from 'happy-dom';

const FIXTURE = new URL('../fixtures/comments-WkKhJx0Rz1I.public.json', import.meta.url);
const HANDLE = /@[\p{L}\p{N}._-]+/gu;

/** Text of a #content-text element, with emoji images replaced by their alt text. */
function textOf(element) {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === 3) text += node.textContent;
    else if (node.nodeType === 1) {
      text += node.tagName === 'IMG' ? (node.getAttribute('alt') ?? '') : textOf(node);
    }
  }
  return text;
}

/**
 * Comparable form: handles masked; emoji, invisible characters and spacing removed.
 * The JSON fixture was saved from visible text, so it lacks emoji drawn as images.
 */
const comparable = (text) =>
  text
    .replace(HANDLE, '@')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]|\uFE0F/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {string} rawHtml
 * @param {{ author: string, text: string }[]} fixtureComments
 */
export function pseudonymizePage(rawHtml, fixtureComments) {
  const window = new Window();
  const document = new window.DOMParser().parseFromString(rawHtml, 'text/html');

  const ownerHref = document
    .querySelector('ytd-video-owner-renderer a[href^="/@"]')
    ?.getAttribute('href');
  const owner = ownerHref ? ownerHref.slice(1) : null;

  // Authors, in document order, with the text of their comment.
  const comments = [...document.querySelectorAll('ytd-comment-thread-renderer')].map((thread) => {
    const container = thread.querySelector(':scope > #comment-container');
    const href = container?.querySelector('#author-text')?.getAttribute('href') ?? '';
    const content = container?.querySelector('#content-text');
    return {
      handle: href.startsWith('/@') ? href.slice(1) : null,
      text: content ? textOf(content) : '',
    };
  });

  // 1. Known authors: same comment text as in the JSON fixture.
  const byText = new Map(fixtureComments.map((c) => [comparable(c.text), c.author]));
  /** @type {Map<string, string>} */
  const mapping = new Map();
  for (const { handle, text } of comments) {
    const pseudonym = byText.get(comparable(text));
    if (handle && pseudonym && !mapping.has(handle)) mapping.set(handle, pseudonym);
  }

  // 2. Every other handle (unknown authors, mentions) gets a new number.
  let next = Math.max(...fixtureComments.map((c) => Number(c.author.replace(/\D/g, '')) || 0)) + 1;
  const authorHandles = comments.map((c) => c.handle).filter((h) => h !== null);
  const mentioned = [...rawHtml.matchAll(HANDLE)].map((m) => m[0].replace(/[._-]+$/, ''));
  for (const handle of [...authorHandles, ...mentioned]) {
    if (handle === owner || mapping.has(handle)) continue;
    if ([...mapping.keys()].some((known) => known.startsWith(handle) || handle.startsWith(known)))
      continue;
    mapping.set(handle, `@autor${String(next++).padStart(2, '0')}`);
  }

  // 3. Replace, longest handles first so "@ab." is handled before "@ab".
  let html = rawHtml;
  for (const handle of [...mapping.keys()].sort((a, b) => b.length - a.length)) {
    html = html.replace(
      new RegExp(`${escapeRegExp(handle)}(?![\\p{L}\\p{N}_-])`, 'gu'),
      mapping.get(handle) ?? handle,
    );
  }
  const channelIds = [...new Set([...html.matchAll(/\/channel\/[\w-]+/g)].map((m) => m[0]))];
  channelIds.forEach((id, i) => {
    html = html.split(id).join(`/channel/UC${String(i + 1).padStart(4, '0')}`);
  });

  const matched = comments.filter((c) => byText.has(comparable(c.text))).length;
  return { html, mapping, owner, comments: comments.length, matched };
}

function main() {
  const [input, output, ...rest] = process.argv.slice(2);
  if (!input || !output) {
    console.error(
      'Usage: node scripts/pseudonymize-page.mjs <raw.html> <out.html> [--captured YYYY-MM-DD]',
    );
    process.exit(1);
  }
  const captured = rest[rest.indexOf('--captured') + 1] ?? new Date().toISOString().slice(0, 10);
  const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const { html, owner, comments, matched, mapping } = pseudonymizePage(
    readFileSync(input, 'utf8'),
    fixture.comments,
  );
  const body = html.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '');
  const page = [
    '<!doctype html>',
    `<!-- Comment section of https://www.youtube.com/watch?v=WkKhJx0Rz1I, captured ${captured}.`,
    '     Scripts, styles and images removed; commenters pseudonymized with',
    '     scripts/pseudonymize-page.mjs. Real usernames never appear in this file. -->',
    '<html lang="es">',
    '<head><meta charset="utf-8"><title>YouTube comment section sample</title></head>',
    `<body>${body}</body>`,
    '</html>',
    '',
  ].join('\n');
  writeFileSync(output, page);
  console.log(
    `Wrote ${output}: ${comments} comments, ${matched} matched to the JSON fixture, ` +
      `${mapping.size} handles pseudonymized, owner kept: ${owner}`,
  );
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '')
) {
  main();
}
