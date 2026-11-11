// Marks suspicious comments on the page: a border around the comment and a label
// with the reason(s). Only adds its own marks; never touches YouTube's controls.
import type { Reason } from '../core/index.ts';
import { format } from '../i18n/index.ts';
import type { Messages } from '../i18n/index.ts';
import { SELECTORS } from './selectors.ts';

/** Set on the comment's own container while it is highlighted. */
export const HIGHLIGHT_ATTRIBUTE = 'data-spam-sentinel-flagged';
/** Set on the label element this extension inserts. */
export const LABEL_ATTRIBUTE = 'data-spam-sentinel-label';

const BORDER = {
  outline: '2px solid #d93025',
  outlineOffset: '4px',
  borderRadius: '8px',
} as const;

const LABEL_STYLE = [
  'display: inline-block',
  'margin: 8px 0 4px',
  'padding: 2px 8px',
  'border-radius: 4px',
  'background: #fce8e6',
  'color: #a50e0e',
  'font: 500 12px/1.5 Roboto, Arial, sans-serif',
].join(';');

/** One reason as a short sentence in the user's language. */
export function formatReason(reason: Reason, t: Messages): string {
  if (reason.detector === 'campaign') {
    return format(t.reasonCampaign, { term: reason.term, count: reason.seedCount });
  }
  return reason.category
    ? format(t.reasonKeyword, { pattern: reason.pattern, category: reason.category })
    : format(t.reasonKeywordNoCategory, { pattern: reason.pattern });
}

/** The label this extension placed right before `own`, if any. */
function labelBefore(own: Element): Element | null {
  const previous = own.previousElementSibling;
  return previous?.hasAttribute(LABEL_ATTRIBUTE) ? previous : null;
}

function removeBorder(own: HTMLElement): void {
  own.removeAttribute(HIGHLIGHT_ATTRIBUTE);
  for (const property of Object.keys(BORDER)) {
    own.style.removeProperty(property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
  }
  if (own.getAttribute('style') === '') own.removeAttribute('style');
}

/**
 * Highlights one comment thread, or updates its label if it is already
 * highlighted. The label goes just before the thread's own comment, outside its
 * text, so the reader never picks it up. Nothing is touched when the label
 * already says the same thing, so rescanning does not make the page flicker.
 */
export function highlight(thread: Element, reasons: readonly Reason[], t: Messages): void {
  const own = thread.querySelector<HTMLElement>(SELECTORS.ownComment);
  if (!own) return;

  const text = format(t.flaggedLabel, {
    reasons: reasons.map((r) => formatReason(r, t)).join(' · '),
  });

  const existing = labelBefore(own);
  if (existing && own.hasAttribute(HIGHLIGHT_ATTRIBUTE)) {
    if (existing.textContent !== text) existing.textContent = text;
    return;
  }

  own.setAttribute(HIGHLIGHT_ATTRIBUTE, '');
  Object.assign(own.style, BORDER);

  const label = own.ownerDocument.createElement('div');
  label.setAttribute(LABEL_ATTRIBUTE, '');
  label.setAttribute('role', 'note');
  label.setAttribute('style', LABEL_STYLE);
  label.textContent = text;
  own.before(label);
}

/** Removes the highlight from one thread, if it has one. */
export function unhighlight(thread: Element): void {
  const own = thread.querySelector<HTMLElement>(SELECTORS.ownComment);
  if (!own) return;
  labelBefore(own)?.remove();
  if (own.hasAttribute(HIGHLIGHT_ATTRIBUTE)) removeBorder(own);
}

/** Removes every border, label and style added by `highlight`. */
export function clearHighlights(root: ParentNode): void {
  for (const label of root.querySelectorAll(`[${LABEL_ATTRIBUTE}]`)) label.remove();
  for (const own of root.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_ATTRIBUTE}]`)) {
    removeBorder(own);
  }
}
