import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

// Invisible characters (zero-width spaces, joiners, bidi controls, line and
// paragraph separators) look like nothing in an editor, can be deleted by
// accident, and can break regular expressions. Source files must write them as
// escapes instead. Fixtures are excluded: they hold real captured text.
const root = fileURLToPath(new URL('../..', import.meta.url));
const SCANNED = ['src', 'entrypoints', 'scripts', 'tests', 'docs'];
const TEXT_FILE = /\.(ts|tsx|mjs|js|css|html|md|json)$/;
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\p{Cf}\p{Zl}\p{Zp}]/u;

const filesIn = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });

it('source files contain no literal invisible characters', () => {
  const offenders: string[] = [];
  for (const file of SCANNED.flatMap((dir) => filesIn(join(root, dir)))) {
    if (!TEXT_FILE.test(file)) continue;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const match = INVISIBLE.exec(line);
        if (match) {
          const code = match[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
          offenders.push(`${relative(root, file).replace(/\\/g, '/')}:${i + 1} U+${code}`);
        }
      });
  }
  expect(offenders).toEqual([]);
});

it('the check itself detects an invisible character', () => {
  expect(INVISIBLE.test(`pre${String.fromCodePoint(0x200b)}sale`)).toBe(true);
  expect(INVISIBLE.test(String.fromCodePoint(0x2028))).toBe(true);
  expect(INVISIBLE.test('presale')).toBe(false);
});
