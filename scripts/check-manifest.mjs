// @ts-check
// Checks the production build's manifest against the permission policy.
// Runs after `pnpm build` as the last step of `pnpm verify`.
import { readFileSync } from 'node:fs';
import { checkManifest } from './manifest-policy.mjs';

const path = new URL('../.output/chrome-mv3/manifest.json', import.meta.url);
const manifest = JSON.parse(readFileSync(path, 'utf8'));
const errors = checkManifest(manifest);

if (errors.length > 0) {
  console.error('Manifest policy violations:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log(
  `Manifest OK: permissions [${(manifest.permissions ?? []).join(', ')}], ` +
    `host access only to YouTube.`,
);
