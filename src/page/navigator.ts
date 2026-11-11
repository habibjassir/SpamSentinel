// "Next suspicious": finds the next highlighted comment in page order.
// Works from the live page every time, so comments added, removed or
// re-rendered between presses never leave it pointing at something stale.
import { HIGHLIGHT_ATTRIBUTE } from './highlighter.ts';

export interface FlaggedPosition {
  /** The highlighted comment's own container. */
  element: Element;
  /** 1-based position among the highlighted comments. */
  index: number;
  count: number;
}

const DOCUMENT_POSITION_FOLLOWING = 4;

/** Highlighted comments, in page order. */
export function flaggedComments(root: ParentNode): Element[] {
  return [...root.querySelectorAll(`[${HIGHLIGHT_ATTRIBUTE}]`)];
}

/**
 * The highlighted comment after `current`, wrapping to the first after the
 * last. If `current` is no longer highlighted, continues with the next one
 * after it on the page; if it was removed from the page, starts over.
 * Returns `null` when nothing is highlighted.
 */
export function nextFlagged(root: ParentNode, current: Element | null): FlaggedPosition | null {
  const list = flaggedComments(root);
  if (list.length === 0) return null;

  let next = 0;
  if (current) {
    const at = list.indexOf(current);
    if (at >= 0) {
      next = (at + 1) % list.length;
    } else if (current.isConnected) {
      const after = list.findIndex(
        (element) => (current.compareDocumentPosition(element) & DOCUMENT_POSITION_FOLLOWING) !== 0,
      );
      next = after >= 0 ? after : 0;
    }
  }
  return { element: list[next]!, index: next + 1, count: list.length };
}

/** 1-based position of `current` among the highlighted comments, or `null`. */
export function positionOf(root: ParentNode, current: Element | null): FlaggedPosition | null {
  if (!current) return null;
  const list = flaggedComments(root);
  const at = list.indexOf(current);
  return at >= 0 ? { element: current, index: at + 1, count: list.length } : null;
}
