import { describe, expect, it } from 'vitest';
import { checkManifest } from '../../scripts/manifest-policy.mjs';

const valid = {
  manifest_version: 3,
  name: 'SpamSentinel',
  version: '0.0.0',
  permissions: ['storage'],
  content_scripts: [{ matches: ['https://www.youtube.com/*'], js: ['content-scripts/content.js'] }],
  options_ui: { page: 'options.html' },
};

describe('checkManifest', () => {
  it('accepts storage plus a YouTube content script', () => {
    expect(checkManifest(valid)).toEqual([]);
  });

  it('rejects any permission other than storage', () => {
    const errors = checkManifest({ ...valid, permissions: ['storage', 'tabs'] });
    expect(errors.join('\n')).toMatch(/tabs/);
  });

  it('rejects optional permissions', () => {
    const errors = checkManifest({ ...valid, optional_permissions: ['scripting'] });
    expect(errors.join('\n')).toMatch(/scripting/);
  });

  it('rejects host permissions outside YouTube', () => {
    const errors = checkManifest({ ...valid, host_permissions: ['<all_urls>'] });
    expect(errors.join('\n')).toMatch(/<all_urls>/);
  });

  it('rejects content scripts that match sites other than YouTube', () => {
    const errors = checkManifest({
      ...valid,
      content_scripts: [{ matches: ['https://www.youtube.com/*', '*://*/*'], js: ['x.js'] }],
    });
    expect(errors.join('\n')).toMatch(/\*:\/\/\*\/\*/);
  });

  it('rejects manifests that are not Manifest V3', () => {
    expect(checkManifest({ ...valid, manifest_version: 2 }).join('\n')).toMatch(/Manifest V3/);
  });
});
