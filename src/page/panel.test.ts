import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../i18n/index.ts';
import { PANEL_HOST_ID, createPanel } from './panel.ts';

beforeEach(() => {
  document.body.innerHTML = '';
});

const shadow = () => document.getElementById(PANEL_HOST_ID)?.shadowRoot;
const button = () => shadow()?.querySelector('button');
const status = () => shadow()?.querySelector('[role="status"]');

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

  it('can be removed', () => {
    const panel = createPanel(document, messages.en, () => {});
    panel.destroy();
    expect(document.getElementById(PANEL_HOST_ID)).toBeNull();
  });
});
