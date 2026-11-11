// Settings persistence on chrome.storage.local, through WXT's storage API.
// Every read and write goes through SettingsSchema, so the rest of the
// extension only ever sees valid settings.
import { storage } from 'wxt/utils/storage';
import { pickLanguage } from '../i18n/index.ts';
import { defaultSettings } from './defaults.ts';
import { SettingsSchema } from './schema.ts';
import type { Settings } from './schema.ts';

export const SETTINGS_KEY = 'local:settings';

/**
 * `version` lets a later increment change the shape and migrate stored data
 * (WXT runs `migrations` on startup). Stored as unknown: it is validated on read.
 */
const settingsItem = storage.defineItem<unknown>(SETTINGS_KEY, { version: 1 });

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
