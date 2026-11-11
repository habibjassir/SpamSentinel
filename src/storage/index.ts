export { defaultSettings } from './defaults.ts';
export {
  RuleSchema,
  SCAN_DELAY_DEFAULT_MS,
  SCAN_DELAY_MAX_MS,
  SCAN_DELAY_MIN_MS,
  SettingsSchema,
} from './schema.ts';
export type { Settings } from './schema.ts';
export { SETTINGS_KEY, loadSettings, saveSettings, watchSettings } from './settings.ts';
