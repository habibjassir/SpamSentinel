import { beforeEach, describe, expect, it } from 'vitest';
import { messages } from '../i18n/index.ts';
import { highlight, unhighlight } from './highlighter.ts';
import { flaggedComments, nextFlagged } from './navigator.ts';

const reason = [{ detector: 'keyword' as const, ruleId: 'r', category: '', pattern: 'presale' }];

/** Builds `n` comment threads; returns them in page order. */
function threads(n: number): Element[] {
  document.body.innerHTML = '';
  return Array.from({ length: n }, (_, i) => {
    const thread = document.createElement('ytd-comment-thread-renderer');
    thread.innerHTML = `<div id="comment-container"><span id="content-text">comment ${i}</span></div>`;
    document.body.append(thread);
    return thread;
  });
}
const own = (thread: Element) => thread.querySelector('#comment-container')!;

let all: Element[];
beforeEach(() => {
  all = threads(5);
  for (const i of [1, 3, 4]) highlight(all[i]!, reason, messages.en);
});

describe('flaggedComments', () => {
  it('lists highlighted comments in page order', () => {
    expect(flaggedComments(document)).toEqual([own(all[1]!), own(all[3]!), own(all[4]!)]);
  });
});

describe('nextFlagged', () => {
  it('starts at the first highlighted comment', () => {
    expect(nextFlagged(document, null)).toEqual({ element: own(all[1]!), index: 1, count: 3 });
  });

  it('goes to the next one in page order', () => {
    expect(nextFlagged(document, own(all[1]!))?.index).toBe(2);
    expect(nextFlagged(document, own(all[3]!))?.element).toBe(own(all[4]!));
  });

  it('wraps around after the last one', () => {
    expect(nextFlagged(document, own(all[4]!))).toEqual({
      element: own(all[1]!),
      index: 1,
      count: 3,
    });
  });

  it('continues after a current comment that is no longer highlighted', () => {
    unhighlight(all[3]!);
    expect(nextFlagged(document, own(all[3]!))).toEqual({
      element: own(all[4]!),
      index: 2,
      count: 2,
    });
  });

  it('starts over when the current comment was removed from the page', () => {
    const removed = own(all[3]!);
    all[3]!.remove();
    expect(nextFlagged(document, removed)?.element).toBe(own(all[1]!));
  });

  it('returns null when nothing is highlighted', () => {
    for (const thread of all) unhighlight(thread);
    expect(nextFlagged(document, null)).toBeNull();
  });
});
