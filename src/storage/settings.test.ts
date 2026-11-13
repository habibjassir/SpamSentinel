import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { defaultSettings } from './defaults.ts';
import {
  SETTINGS_KEY,
  loadSettings,
  migrateToV2,
  migrateToV3,
  saveSettings,
  settingsStorageItem,
  watchSettings,
} from './settings.ts';

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

  it('migrates version 1 settings to version 2, keeping every existing value', async () => {
    const v1 = {
      language: 'es',
      keywordsEnabled: false,
      campaignsEnabled: true,
      rules: [defaultSettings('en').rules[0]],
      exemptPhrases: ['es una estafa'],
      allowlist: ['Bitcoin'],
    };
    // Version 1 data has no version metadata, as stored by Increment 3.
    await fakeBrowser.storage.local.set({ [storedKey]: v1 });
    await settingsStorageItem.migrate();
    expect(await loadSettings('en-US')).toEqual({
      ...v1,
      autoScan: true,
      scanDelayMs: 500,
      impersonationEnabled: true,
    });
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

describe('migrateToV3', () => {
  it('adds the impersonation switch and keeps everything else', () => {
    expect(migrateToV3({ autoScan: false, scanDelayMs: 1000 })).toEqual({
      autoScan: false,
      scanDelayMs: 1000,
      impersonationEnabled: true,
    });
    expect(migrateToV3({ impersonationEnabled: false })).toEqual({ impersonationEnabled: false });
    expect(migrateToV3(null)).toBeNull();
  });
});

describe('migrateToV2', () => {
  it('adds the automatic scan defaults and keeps everything else', () => {
    expect(migrateToV2({ language: 'en', rules: [] })).toEqual({
      language: 'en',
      rules: [],
      autoScan: true,
      scanDelayMs: 500,
    });
  });

  it('keeps values that already exist', () => {
    expect(migrateToV2({ autoScan: false, scanDelayMs: 1000 })).toEqual({
      autoScan: false,
      scanDelayMs: 1000,
    });
  });

  it('leaves non-object data alone, so validation can replace it with defaults', () => {
    expect(migrateToV2('broken')).toBe('broken');
    expect(migrateToV2(null)).toBeNull();
  });
});
