// Floating panel with the "Scan for spam" button and the counter. It lives in a
// Shadow DOM, so YouTube's styles cannot change it and its styles cannot leak.
import { format } from '../i18n/index.ts';
import type { Messages } from '../i18n/index.ts';
import type { ScanResult } from './scan.ts';

export const PANEL_HOST_ID = 'spam-sentinel-panel';

export interface Panel {
  showResult(result: ScanResult): void;
  setMessages(messages: Messages): void;
  destroy(): void;
}

const STYLE = `
  :host { all: initial; }
  .panel {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 260px;
    padding: 10px 12px;
    border: 1px solid #dadce0;
    border-radius: 10px;
    background: #ffffff;
    color: #202124;
    box-shadow: 0 2px 8px rgb(0 0 0 / 20%);
    font: 13px/1.4 Roboto, Arial, sans-serif;
  }
  .title { font-weight: 600; }
  button {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: #d93025;
    color: #ffffff;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  button:focus-visible { outline: 2px solid #1a73e8; outline-offset: 2px; }
  .status { margin: 0; color: #5f6368; }
  @media (prefers-color-scheme: dark) {
    .panel { border-color: #3c4043; background: #202124; color: #e8eaed; }
    .status { color: #9aa0a6; }
  }
`;

/** Mounts the panel once per document and returns its controls. */
export function createPanel(doc: Document, messages: Messages, onScan: () => void): Panel {
  doc.getElementById(PANEL_HOST_ID)?.remove();

  const host = doc.createElement('div');
  host.id = PANEL_HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });

  const style = doc.createElement('style');
  style.textContent = STYLE;

  const panel = doc.createElement('section');
  panel.className = 'panel';

  const title = doc.createElement('div');
  title.className = 'title';

  const button = doc.createElement('button');
  button.type = 'button';
  button.addEventListener('click', onScan);

  const status = doc.createElement('p');
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  panel.append(title, button, status);
  shadow.append(style, panel);
  doc.body.append(host);

  let t = messages;
  let last: ScanResult | null = null;

  const render = () => {
    panel.setAttribute('aria-label', t.panelTitle);
    title.textContent = t.panelTitle;
    button.textContent = t.scanButton;
    status.textContent =
      last === null
        ? t.panelIdle
        : last.total === 0
          ? t.panelNoComments
          : format(t.panelCounter, { flagged: last.flagged, total: last.total });
  };
  render();

  return {
    showResult(result) {
      last = result;
      render();
    },
    setMessages(next) {
      t = next;
      render();
    },
    destroy() {
      host.remove();
    },
  };
}
