import { describe, expect, it } from 'vitest';
import { LANGUAGES, format, messages, pickLanguage } from './index.ts';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('i18n dictionaries', () => {
  it('Spanish and English have exactly the same keys', () => {
    expect(Object.keys(messages.es).sort()).toEqual(Object.keys(messages.en).sort());
  });

  it('every translation uses the same placeholders as English', () => {
    for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
      expect(placeholders(messages.es[key]), key).toEqual(placeholders(messages.en[key]));
    }
  });

  it('has no empty strings', () => {
    for (const language of LANGUAGES) {
      for (const [key, text] of Object.entries(messages[language])) {
        expect(text.trim(), `${language}.${key}`).not.toBe('');
      }
    }
  });
});

describe('pickLanguage', () => {
  it('uses Spanish for any Spanish browser locale', () => {
    expect(pickLanguage('es')).toBe('es');
    expect(pickLanguage('es-MX')).toBe('es');
    expect(pickLanguage('ES-419')).toBe('es');
  });

  it('falls back to English for anything else', () => {
    expect(pickLanguage('en-US')).toBe('en');
    expect(pickLanguage('pt-BR')).toBe('en');
    expect(pickLanguage('')).toBe('en');
    expect(pickLanguage(undefined)).toBe('en');
  });
});

describe('format', () => {
  it('replaces placeholders', () => {
    expect(format('Limit is {limit} characters', { limit: 200 })).toBe('Limit is 200 characters');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(format('Hello {name}', {})).toBe('Hello {name}');
  });
});
