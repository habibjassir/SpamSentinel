import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// The boundary rule protects src/core/ from browser, DOM and WXT APIs
// (CLAUDE.md rule 3). These tests lint fixture text *as if* it were a file in
// src/core/, so a broken ESLint config is caught here instead of silently
// letting browser code into the core.
const root = fileURLToPath(new URL('../..', import.meta.url));
const fixture = (name: string) =>
  readFileSync(new URL(`../lint-fixtures/${name}`, import.meta.url), 'utf8');

async function lintAs(filePath: string, code: string) {
  const eslint = new ESLint({ cwd: root });
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error('ESLint returned no result');
  return result.messages.filter((m) => m.severity === 2);
}

describe('ESLint boundary for src/core/', () => {
  it('accepts plain TypeScript in src/core/', async () => {
    const errors = await lintAs('src/core/clean.ts', fixture('core-boundary-clean.ts.txt'));
    expect(errors).toEqual([]);
  });

  it('rejects chrome, browser, DOM globals and WXT imports in src/core/', async () => {
    const errors = await lintAs('src/core/violation.ts', fixture('core-boundary-violation.ts.txt'));
    const text = errors.map((e) => `${e.ruleId}: ${e.message}`).join('\n');

    for (const name of ['chrome', 'browser', 'document', 'window']) {
      expect(text).toMatch(new RegExp(`no-restricted-globals: .*'${name}'`));
    }
    expect(text).toMatch(/no-restricted-imports: .*'#imports'/);
    expect(text).toMatch(/no-restricted-imports: .*'wxt\/utils\/define-content-script'/);
  });

  it('does not apply the core restrictions outside src/core/', async () => {
    const errors = await lintAs(
      'src/page/example.ts',
      'export const title = (): string => document.title;\n',
    );
    expect(errors).toEqual([]);
  });
});
