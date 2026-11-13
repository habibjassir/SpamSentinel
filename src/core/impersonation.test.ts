// INVENTED CASES, NOT VALIDATED WITH REAL ONES.
// No real impersonation comment has been collected yet (docs/design.md,
// "Pendientes"). Replace or extend these with real cases when they appear.
import { describe, expect, it } from 'vitest';
import { DEFAULT_IMPERSONATION_OPTIONS } from './defaults.ts';
import { asksForContact, detectImpersonation, handleCore } from './impersonation.ts';
import type { Comment } from './types.ts';

const channel = { handle: '@Alejandrosalomondrin', name: 'Alejandro Salomon' };
const c = (author: string, text = 'Great video'): Comment => ({ author, text, isReply: false });

const flagged = (comments: Comment[]) =>
  detectImpersonation(comments, channel, DEFAULT_IMPERSONATION_OPTIONS).map((v) => v.flagged);

describe('handleCore', () => {
  const core = (handle: string) => handleCore(handle, DEFAULT_IMPERSONATION_OPTIONS.suffixes);

  it('drops the @, letter case, separators and trailing digits', () => {
    expect(core('@Alejandro_Salomon.Drin-99')).toBe('alejandrosalomondrin');
  });

  it('drops common suffixes such as official, oficial, ofc, real, tv, soporte', () => {
    expect(core('@AlejandroSalomon.oficial')).toBe('alejandrosalomon');
    expect(core('@alejandrosalomon_tv_official')).toBe('alejandrosalomon');
    expect(core('@salomon.soporte')).toBe('salomon');
  });
});

describe('asksForContact', () => {
  const asks = (text: string) =>
    asksForContact(text, DEFAULT_IMPERSONATION_OPTIONS.contactPatterns);

  it('recognizes messaging apps, contact requests and phone numbers', () => {
    expect(asks('Write to me on WhatsApp')).toBe(true);
    expect(asks('escríbeme por Telegram')).toBe(true);
    expect(asks('Contáctame: wa.me/573001234567')).toBe(true);
    expect(asks('Llama al +57 300 123 4567')).toBe(true);
    expect(asks('t.me/salomon_inversiones')).toBe(true);
  });

  it('ignores ordinary comments', () => {
    expect(asks('Gracias por el análisis, saludos desde Bogotá')).toBe(false);
    expect(asks('Minuto 2:45:39 BTC')).toBe(false);
  });
});

describe('detectImpersonation (invented cases, not validated)', () => {
  it('flags near-identical handles on their own', () => {
    expect(
      flagged([
        c('@alejandrosalomondrin1'),
        c('@alejandro_salomon'),
        c('@AlejandroSalomon.oficial'),
        c('@alejandrosalomondrn'),
      ]),
    ).toEqual([true, true, true, true]);
  });

  it('flags a similar handle only when the comment asks for contact', () => {
    expect(
      flagged([
        c('@salomoninversiones', 'Gracias a todos por ver el video'),
        c(
          '@salomoninversiones',
          'Escríbeme por WhatsApp para invertir con el tío +57 300 123 4567',
        ),
      ]),
    ).toEqual([false, true]);
  });

  it('never flags the real channel, in any letter case', () => {
    expect(
      flagged([
        c('@Alejandrosalomondrin', 'Escríbanme por WhatsApp'),
        c('@alejandrosalomondrin'),
        c('@ALEJANDROSALOMONDRIN'),
      ]),
    ).toEqual([false, false, false]);
  });

  it('does not flag unrelated authors, or fans without a contact request', () => {
    expect(
      flagged([
        c('@autor01', 'Escríbeme por WhatsApp'),
        c('@salomonfan', 'El mejor canal'),
        c('@alejandro123', 'Gracias tío'),
        c('@mariasalas'),
      ]),
    ).toEqual([false, false, false, false]);
  });

  it('explains the reason, including whether contact was requested', () => {
    const [near, similar] = detectImpersonation(
      [c('@alejandro_salomon'), c('@salomoninversiones', 'escríbeme al wa.me/573001234567')],
      channel,
      DEFAULT_IMPERSONATION_OPTIONS,
    );
    expect(near?.reasons).toEqual([
      {
        detector: 'impersonation',
        author: '@alejandro_salomon',
        channel: '@Alejandrosalomondrin',
        contact: false,
      },
    ]);
    expect(similar?.reasons[0]).toMatchObject({ author: '@salomoninversiones', contact: true });
  });

  it('flags nothing when the channel is unknown', () => {
    const verdicts = detectImpersonation(
      [c('@alejandro_salomon')],
      null,
      DEFAULT_IMPERSONATION_OPTIONS,
    );
    expect(verdicts.map((v) => v.flagged)).toEqual([false]);
  });

  it('respects the thresholds from the options', () => {
    const strict = { ...DEFAULT_IMPERSONATION_OPTIONS, nearMaxEdits: 0 };
    expect(
      detectImpersonation([c('@alejandrosalomondrn')], channel, strict).map((v) => v.flagged),
    ).toEqual([false]);
  });
});
