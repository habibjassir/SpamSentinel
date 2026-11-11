import { en } from './en.ts';
import type { Messages } from './en.ts';
import { es } from './es.ts';

export type { Messages };

export const LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const messages: Readonly<Record<Language, Messages>> = { es, en };

/** Spanish for any Spanish browser locale ("es", "es-MX", "es-419"), English otherwise. */
export function pickLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

/** Fills {name} placeholders. Unknown placeholders are left as they are. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}
