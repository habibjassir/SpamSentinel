import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LABEL_ATTRIBUTE } from './highlighter.ts';
import { createScanObserver } from './observer.ts';

// MutationObserver callbacks run as microtasks; flush them, then move fake time.
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const thread = (text: string) => {
  const el = document.createElement('ytd-comment-thread-renderer');
  el.textContent = text;
  return el;
};

let contents: HTMLElement;
beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML =
    '<div id="player"></div><ytd-comments id="comments"><div id="contents"></div></ytd-comments>';
  contents = document.getElementById('contents')!;
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createScanObserver', () => {
  it('groups many changes within the delay into one scan', async () => {
    const onScan = vi.fn();
    const observer = createScanObserver(document, 500, onScan);
    observer.start();

    for (let i = 0; i < 10; i++) contents.append(thread(`comment ${i}`));
    await flush();
    vi.advanceTimersByTime(499);
    expect(onScan).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onScan).toHaveBeenCalledOnce();
    observer.stop();
  });

  it('restarts the wait when a new change arrives', async () => {
    const onScan = vi.fn();
    const observer = createScanObserver(document, 500, onScan);
    observer.start();

    contents.append(thread('first'));
    await flush();
    vi.advanceTimersByTime(400);
    contents.append(thread('second'));
    await flush();
    vi.advanceTimersByTime(400);
    expect(onScan).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onScan).toHaveBeenCalledOnce();
    observer.stop();
  });

  it('ignores the extension’s own labels', async () => {
    const onScan = vi.fn();
    const observer = createScanObserver(document, 500, onScan);
    observer.start();

    const label = document.createElement('div');
    label.setAttribute(LABEL_ATTRIBUTE, '');
    contents.append(label);
    label.remove();
    await flush();
    vi.advanceTimersByTime(1000);
    expect(onScan).not.toHaveBeenCalled();
    observer.stop();
  });

  it('ignores changes outside the comments, such as the video player', async () => {
    const onScan = vi.fn();
    const observer = createScanObserver(document, 500, onScan);
    observer.start();

    document.getElementById('player')!.append(document.createElement('span'));
    await flush();
    vi.advanceTimersByTime(1000);
    expect(onScan).not.toHaveBeenCalled();
    observer.stop();
  });

  it('reacts to text filled into an existing comment', async () => {
    const onScan = vi.fn();
    const empty = thread('');
    contents.append(empty);
    const observer = createScanObserver(document, 500, onScan);
    observer.start();

    empty.append(document.createElement('span'));
    await flush();
    vi.advanceTimersByTime(500);
    expect(onScan).toHaveBeenCalledOnce();
    observer.stop();
  });

  it('stopping cancels a pending scan and stops watching', async () => {
    const onScan = vi.fn();
    const observer = createScanObserver(document, 500, onScan);
    observer.start();
    contents.append(thread('pending'));
    await flush();
    observer.stop();
    vi.advanceTimersByTime(1000);

    contents.append(thread('after stop'));
    await flush();
    vi.advanceTimersByTime(1000);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('schedule() asks for a scan after the delay, and setDelay changes it', () => {
    const onScan = vi.fn();
    const observer = createScanObserver(document, 500, onScan);
    observer.setDelay(250);
    observer.schedule();
    vi.advanceTimersByTime(249);
    expect(onScan).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onScan).toHaveBeenCalledOnce();
  });
});
