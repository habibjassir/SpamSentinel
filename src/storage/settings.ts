// Settings persistence on chrome.storage.local, through WXT's storage API.
// Every read and write goes through SettingsSchema, so the rest of the
// extension only ever sees valid settings.
import { storage } from 'wxt/utils/storage';
import { pickLanguage } from '../i18n/index.ts';
import { defaultSettings } from './defaults.ts';
import { SCAN_DELAY_DEFAULT_MS, SettingsSchema } from './schema.ts';
import type { Settings } from './schema.ts';

export const SETTINGS_KEY = 'local:settings';

/**
 * Version 1 to 2 (Increment 6): adds automatic scanning. Existing values are
 * kept; anything that is not an object is left alone, and validation on read
 * replaces it with the defaults.
 */
export function migrateToV2(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  return { autoScan: true, scanDelayMs: SCAN_DELAY_DEFAULT_MS, ...value };
}

/**
 * Versioned so the shape can change: WXT runs `migrations` on startup, from the
 * stored version up to `version`. Stored as unknown: it is validated on read.
 * Exported for tests.
 */
export const settingsStorageItem = storage.defineItem<unknown>(SETTINGS_KEY, {
  version: 2,
  migrations: { 2: migrateToV2 },
});
const settingsItem = settingsStorageItem;

const currentBrowserLanguage = () =>
  typeof navigator === 'undefined' ? undefined : navigator.language;

function parseOrDefault(value: unknown, browserLanguage: string | undefined): Settings {
  const parsed = SettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultSettings(pickLanguage(browserLanguage));
}

/**
 * Loads the saved settings. Returns the defaults on first run, or when the
 * stored data is missing or invalid, instead of failing.
 */
export async function loadSettings(
  browserLanguage: string | undefined = currentBrowserLanguage(),
): Promise<Settings> {
  return parseOrDefault(await settingsItem.getValue(), browserLanguage);
}

/** Validates and saves. Throws (and stores nothing) when the settings are invalid. */
export async function saveSettings(settings: Settings): Promise<void> {
  await settingsItem.setValue(SettingsSchema.parse(settings));
}

/** Calls `callback` with validated settings whenever they change. Returns an unsubscribe function. */
export function watchSettings(
  callback: (settings: Settings) => void,
  browserLanguage: string | undefined = currentBrowserLanguage(),
): () => void {
  return settingsItem.watch((value) => callback(parseOrDefault(value, browserLanguage)));
}
