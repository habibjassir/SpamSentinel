// @ts-check
// Prints what the page reader extracts from the captured sample page, for the
// manual comparison with the real video (pnpm read:sample).
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { readComments, readVideoOwner } from '../src/page/reader.ts';

const html = readFileSync(new URL('../fixtures/page-WkKhJx0Rz1I.html', import.meta.url), 'utf8');
const document = /** @type {any} */ (
  new new Window().DOMParser().parseFromString(html, 'text/html')
);

const comments = readComments(document);
const replies = comments.filter((c) => c.comment.isReply).length;
console.log(`Video owner: ${readVideoOwner(document)}`);
console.log(
  `Read ${comments.length} comments: ${comments.length - replies} top-level, ${replies} replies\n`,
);
comments.forEach(({ comment }, i) => {
  const text = comment.text.replace(/\s+/g, ' ');
  const shown = text.length > 70 ? `${text.slice(0, 69)}…` : text;
  console.log(
    `${String(i + 1).padStart(3)}  ${comment.isReply ? '  ↳ ' : ''}${comment.author.padEnd(9)}  ${shown}`,
  );
});
