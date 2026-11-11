import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

// All YouTube selectors live in src/page/selectors.ts, so a YouTube redesign
// means editing one file. This test fails if a YouTube element name or one of
// its well-known ids shows up anywhere else in extension code.
const root = fileURLToPath(new URL('../..', import.meta.url));
const ALLOWED = 'src/page/selectors.ts';
const YOUTUBE_SELECTOR =
  /\bytd-[a-z-]+|#(content-text|author-text|comment-container)\b|is-sub-thread/;

const filesIn = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });

it('YouTube selectors appear only in src/page/selectors.ts', () => {
  const offenders = [...filesIn(join(root, 'src')), ...filesIn(join(root, 'entrypoints'))]
    .map((path) => relative(root, path).replace(/\\/g, '/'))
    .filter((path) => /\.(ts|tsx)$/.test(path) && !path.endsWith('.test.ts') && path !== ALLOWED)
    .filter((path) => YOUTUBE_SELECTOR.test(readFileSync(join(root, path), 'utf8')));
  expect(offenders).toEqual([]);
});
