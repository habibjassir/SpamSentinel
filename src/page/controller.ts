// Decides what the content script does on each page: show the panel on video
// pages, scan automatically or on demand, and reset when the viewer moves to
// another video without a page reload.
import { messages } from '../i18n/index.ts';
import type { Settings } from '../storage/index.ts';
import { clearHighlights } from './highlighter.ts';
import { createScanObserver } from './observer.ts';
import { createPanel } from './panel.ts';
import type { Panel } from './panel.ts';
import { scanPage } from './scan.ts';
import { isVideoPage } from './selectors.ts';

export interface PageController {
  /** Call with the current URL on start and on every navigation. */
  onLocation(url: string): void;
  updateSettings(settings: Settings): void;
  destroy(): void;
}

export function createPageController(doc: Document, initialSettings: Settings): PageController {
  let settings = initialSettings;
  let panel: Panel | null = null;
  let currentVideo: string | null = null;

  const scan = () => {
    if (panel) panel.showResult(scanPage(doc, settings));
  };
  const observer = createScanObserver(doc.body, settings.scanDelayMs, scan);

  const startWatching = () => {
    observer.start();
    observer.schedule(); // comments may already be on the page
  };

  const leave = () => {
    observer.stop();
    clearHighlights(doc);
    panel?.destroy();
    panel = null;
    currentVideo = null;
  };

  const enter = (url: string) => {
    observer.stop();
    clearHighlights(doc);
    if (panel) panel.reset();
    else panel = createPanel(doc, messages[settings.language], scan);
    currentVideo = url;
    if (settings.autoScan) startWatching();
  };

  return {
    onLocation(url) {
      if (!isVideoPage(url)) {
        if (panel) leave();
        return;
      }
      if (url !== currentVideo) enter(url);
    },
    updateSettings(next) {
      const autoScanChanged = next.autoScan !== settings.autoScan;
      settings = next;
      observer.setDelay(next.scanDelayMs);
      if (!panel) return;
      panel.setMessages(messages[next.language]);
      if (autoScanChanged) {
        if (next.autoScan) startWatching();
        else observer.stop();
      }
    },
    destroy() {
      leave();
    },
  };
}
