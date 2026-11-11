import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../i18n/index.ts';
import { PANEL_HOST_ID, createPanel } from './panel.ts';

beforeEach(() => {
  document.body.innerHTML = '';
});

const shadow = () => document.getElementById(PANEL_HOST_ID)?.shadowRoot;
const button = () => shadow()?.querySelector('button');
const status = () => shadow()?.querySelector('[role="status"]');
const nextButton = () => shadow()?.querySelectorAll('button')[1];
const position = () => shadow()?.querySelector('.position');

describe('floating panel', () => {
  it('mounts once, in a shadow root, with the scan button', () => {
    createPanel(document, messages.en, () => {});
    createPanel(document, messages.en, () => {});
    expect(document.querySelectorAll(`#${PANEL_HOST_ID}`)).toHaveLength(1);
    expect(button()?.textContent).toBe('Scan for spam');
    expect(status()?.textContent).toBe('Press the button to check the loaded comments.');
  });

  it('calls onScan when the button is pressed', () => {
    const onScan = vi.fn();
    createPanel(document, messages.en, onScan);
    button()?.click();
    expect(onScan).toHaveBeenCalledOnce();
  });

  it('shows the counter in the current language', () => {
    const panel = createPanel(document, messages.en, () => {});
    panel.showResult({ total: 68, flagged: 16 });
    expect(status()?.textContent).toBe('16 of 68 comments');

    panel.setMessages(messages.es);
    expect(button()?.textContent).toBe('Buscar spam');
    expect(status()?.textContent).toBe('16 de 68 comentarios');
  });

  it('says so when no comments are loaded yet', () => {
    const panel = createPanel(document, messages.en, () => {});
    panel.showResult({ total: 0, flagged: 0 });
    expect(status()?.textContent).toBe(
      'No comments loaded yet. Scroll down to the comments and try again.',
    );
  });

  it('has a "Next suspicious" button, disabled until something is flagged', () => {
    const onNext = vi.fn();
    const panel = createPanel(document, messages.en, () => {}, onNext);
    expect(nextButton()?.textContent).toBe('Next suspicious');
    expect(nextButton()?.disabled).toBe(true);

    panel.showResult({ total: 68, flagged: 0 });
    expect(nextButton()?.disabled).toBe(true);
    panel.showResult({ total: 68, flagged: 16 });
    expect(nextButton()?.disabled).toBe(false);
    nextButton()?.click();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('shows the position in both languages and hides it on reset', () => {
    const panel = createPanel(
      document,
      messages.en,
      () => {},
      () => {},
    );
    expect(position()?.textContent).toBe('');
    panel.showPosition(3, 16);
    expect(position()?.textContent).toBe('3 of 16 suspicious');
    panel.setMessages(messages.es);
    expect(position()?.textContent).toBe('3 de 16 sospechosos');
    panel.showPosition(null, 16);
    expect(position()?.textContent).toBe('');
    panel.showPosition(2, 16);
    panel.reset();
    expect(position()?.textContent).toBe('');
    expect(nextButton()?.disabled).toBe(true);
  });

  it('can be removed', () => {
    const panel = createPanel(document, messages.en, () => {});
    panel.destroy();
    expect(document.getElementById(PANEL_HOST_ID)).toBeNull();
  });
});
