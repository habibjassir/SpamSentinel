// Watches the page for new comments and asks for one scan per burst of changes
// (debounce): YouTube adds comments in bursts while the viewer scrolls.
import { LABEL_ATTRIBUTE } from './highlighter.ts';
import { PANEL_HOST_ID } from './panel.ts';
import { SELECTORS } from './selectors.ts';

export interface ScanObserver {
  /** Starts watching `root` for comment changes. */
  start(): void;
  /** Stops watching and cancels a pending scan. */
  stop(): void;
  /** Asks for a scan after the delay, as if the page had just changed. */
  schedule(): void;
  setDelay(delayMs: number): void;
}

const ELEMENT_NODE = 1;

/** Nodes the extension itself adds: they must never trigger a scan. */
function isOwn(node: Node): boolean {
  if (node.nodeType !== ELEMENT_NODE) return false;
  const element = node as Element;
  return element.hasAttribute(LABEL_ATTRIBUTE) || element.id === PANEL_HOST_ID;
}

function concernsComments(record: MutationRecord): boolean {
  const changed = [...record.addedNodes, ...record.removedNodes];
  if (changed.length === 0 || changed.every(isOwn)) return false;

  // Something changed inside the comment section (new replies, text filled in later)…
  const target = record.target.nodeType === ELEMENT_NODE ? (record.target as Element) : null;
  if (target?.closest(SELECTORS.commentsSection) || target?.closest(SELECTORS.thread)) return true;

  // …or comment threads were added somewhere else.
  return [...record.addedNodes].some(
    (node) =>
      node.nodeType === ELEMENT_NODE &&
      !isOwn(node) &&
      ((node as Element).matches(SELECTORS.thread) ||
        (node as Element).querySelector(SELECTORS.thread) !== null),
  );
}

/**
 * Calls `onScan` once the page has been quiet for `delayMs` after a change to
 * the comments. Changes to the video player, the panel or the extension's own
 * labels are ignored, so highlighting never triggers another scan.
 */
export function createScanObserver(root: Node, delayMs: number, onScan: () => void): ScanObserver {
  let delay = delayMs;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const schedule = () => {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      onScan();
    }, delay);
  };

  const observer = new MutationObserver((records) => {
    if (records.some(concernsComments)) schedule();
  });

  return {
    start() {
      observer.observe(root, { childList: true, subtree: true });
    },
    stop() {
      observer.disconnect();
      cancel();
    },
    schedule,
    setDelay(next) {
      delay = next;
    },
  };
}
