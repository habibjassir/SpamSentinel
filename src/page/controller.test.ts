import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { defaultSettings } from '../storage/defaults.ts';
import { createPageController } from './controller.ts';
import { LABEL_ATTRIBUTE } from './highlighter.ts';
import { PANEL_HOST_ID } from './panel.ts';

const sampleBody = new DOMParser().parseFromString(
  readFileSync(join(process.cwd(), 'fixtures/page-WkKhJx0Rz1I.html'), 'utf8'),
  'text/html',
).body.innerHTML;

const VIDEO = 'https://www.youtube.com/watch?v=WkKhJx0Rz1I';
const OTHER_VIDEO = 'https://www.youtube.com/watch?v=other';
const HOME = 'https://www.youtube.com/';

const panelStatus = () =>
  document.getElementById(PANEL_HOST_ID)?.shadowRoot?.querySelector('[role="status"]')?.textContent;
const labelCount = () => document.querySelectorAll(`[${LABEL_ATTRIBUTE}]`).length;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = sampleBody;
});
afterEach(() => {
  vi.useRealTimers();
});

describe('page controller', () => {
  it('on a video page with automatic scan, shows the panel and scans after the delay', () => {
    const controller = createPageController(document, defaultSettings('en'));
    controller.onLocation(VIDEO);
    expect(document.getElementById(PANEL_HOST_ID)).not.toBeNull();
    vi.advanceTimersByTime(500);
    expect(panelStatus()).toBe('16 of 68 comments');
    expect(labelCount()).toBe(16);
    controller.destroy();
  });

  it('with automatic scan off, waits for the button', () => {
    const controller = createPageController(document, {
      ...defaultSettings('en'),
      autoScan: false,
    });
    controller.onLocation(VIDEO);
    vi.advanceTimersByTime(5000);
    expect(labelCount()).toBe(0);
    document.getElementById(PANEL_HOST_ID)?.shadowRoot?.querySelector('button')?.click();
    expect(panelStatus()).toBe('16 of 68 comments');
    controller.destroy();
  });

  it('outside a video page there is no panel, and leaving a video removes it with its highlights', () => {
    const controller = createPageController(document, defaultSettings('en'));
    controller.onLocation(HOME);
    expect(document.getElementById(PANEL_HOST_ID)).toBeNull();

    controller.onLocation(VIDEO);
    vi.advanceTimersByTime(500);
    expect(labelCount()).toBe(16);
    controller.onLocation(HOME);
    expect(document.getElementById(PANEL_HOST_ID)).toBeNull();
    expect(labelCount()).toBe(0);
    controller.destroy();
  });

  it('moving to another video clears highlights and resets the counter', () => {
    const controller = createPageController(document, defaultSettings('en'));
    controller.onLocation(VIDEO);
    vi.advanceTimersByTime(500);
    controller.onLocation(OTHER_VIDEO);
    expect(labelCount()).toBe(0);
    expect(panelStatus()).toBe('Press the button to check the loaded comments.');
    controller.destroy();
  });

  it('"Next suspicious" moves through the highlights, focusing each label, and wraps', () => {
    const controller = createPageController(document, defaultSettings('en'));
    controller.onLocation(VIDEO);
    vi.advanceTimersByTime(500);
    const labels = [...document.querySelectorAll(`[${LABEL_ATTRIBUTE}]`)];
    const next = () =>
      document.getElementById(PANEL_HOST_ID)?.shadowRoot?.querySelectorAll('button')[1]?.click();
    const position = () =>
      document.getElementById(PANEL_HOST_ID)?.shadowRoot?.querySelector('.position')?.textContent;

    next();
    expect(position()).toBe('1 of 16 suspicious');
    expect(document.activeElement).toBe(labels[0]);
    next();
    expect(position()).toBe('2 of 16 suspicious');
    expect(document.activeElement).toBe(labels[1]);
    for (let i = 0; i < 14; i++) next();
    expect(position()).toBe('16 of 16 suspicious');
    next();
    expect(position()).toBe('1 of 16 suspicious');
    expect(document.activeElement).toBe(labels[0]);
    controller.destroy();
  });

  it('moving to another video resets the position', () => {
    const controller = createPageController(document, defaultSettings('en'));
    controller.onLocation(VIDEO);
    vi.advanceTimersByTime(500);
    document.getElementById(PANEL_HOST_ID)?.shadowRoot?.querySelectorAll('button')[1]?.click();
    controller.onLocation(OTHER_VIDEO);
    expect(
      document.getElementById(PANEL_HOST_ID)?.shadowRoot?.querySelector('.position')?.textContent,
    ).toBe('');
    controller.destroy();
  });

  it('puts the panel back if the page removes it', () => {
    const controller = createPageController(document, defaultSettings('en'));
    controller.onLocation(VIDEO);
    document.getElementById(PANEL_HOST_ID)?.remove();
    vi.advanceTimersByTime(500);
    expect(panelStatus()).toBe('16 of 68 comments');
    controller.destroy();
  });

  it('applies new settings: turning automatic scan on starts scanning', () => {
    const controller = createPageController(document, {
      ...defaultSettings('en'),
      autoScan: false,
    });
    controller.onLocation(VIDEO);
    controller.updateSettings(defaultSettings('es'));
    vi.advanceTimersByTime(500);
    expect(panelStatus()).toBe('16 de 68 comentarios');
    controller.destroy();
  });
});
