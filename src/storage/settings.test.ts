import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { defaultSettings } from './defaults.ts';
import { SETTINGS_KEY, loadSettings, saveSettings, watchSettings } from './settings.ts';

// WXT's fake browser keeps chrome.storage in memory; reset it before each test.
beforeEach(() => {
  fakeBrowser.reset();
});

const storedKey = SETTINGS_KEY.replace(/^local:/, '');

describe('settings storage', () => {
  it('first load returns the defaults, in the browser language', async () => {
    expect(await loadSettings('es-AR')).toEqual(defaultSettings('es'));
    expect(await loadSettings('en-US')).toEqual(defaultSettings('en'));
  });

  it('save then load returns the same data', async () => {
    const settings = {
      ...defaultSettings('en'),
      language: 'es' as const,
      campaignsEnabled: false,
      exemptPhrases: ['was a scam'],
    };
    await saveSettings(settings);
    expect(await loadSettings('en-US')).toEqual(settings);
  });

  it('corrupt stored data loads as defaults', async () => {
    await fakeBrowser.storage.local.set({ [storedKey]: { language: 42, rules: 'nope' } });
    expect(await loadSettings('en-US')).toEqual(defaultSettings('en'));
  });

  it('refuses to save invalid settings and keeps the previous value', async () => {
    const good = defaultSettings('en');
    await saveSettings(good);
    const bad = { ...good, rules: [{ ...good.rules[0]!, kind: 'regex' as const, pattern: '(' }] };
    await expect(saveSettings(bad)).rejects.toThrow();
    expect(await loadSettings('en-US')).toEqual(good);
  });

  it('notifies watchers with validated settings', async () => {
    const callback = vi.fn();
    const unwatch = watchSettings(callback, 'en-US');
    const settings = { ...defaultSettings('en'), keywordsEnabled: false };
    await saveSettings(settings);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith(settings));
    unwatch();
  });
});
