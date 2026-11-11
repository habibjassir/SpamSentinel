// Turns the comments YouTube has loaded into plain data for the core.
// Reads only; never clicks or changes anything on the page.
import type { Comment } from '../core/index.ts';
import { SELECTORS } from './selectors.ts';

export interface ReadComment {
  comment: Comment;
  /** The comment's thread element, for highlighting it later. */
  element: Element;
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/** Text of an element, keeping line breaks; emoji drawn as images contribute their `alt`. */
function textOf(node: Node): string {
  let text = '';
  for (const child of node.childNodes) {
    if (child.nodeType === TEXT_NODE) {
      text += child.textContent ?? '';
    } else if (child.nodeType === ELEMENT_NODE) {
      const element = child as Element;
      text += element.tagName === 'IMG' ? (element.getAttribute('alt') ?? '') : textOf(element);
    }
  }
  return text;
}

/** "/@handle" -> "@handle"; any other link (or none) -> "". */
function handleFrom(link: Element | null): string {
  const href = link?.getAttribute('href') ?? '';
  return href.startsWith('/@') ? href.slice(1) : '';
}

/**
 * The comment section, or `null` when it cannot be found. `null` on a video page
 * means YouTube's structure probably changed, which is different from "no spam".
 */
export function findCommentsSection(root: ParentNode): Element | null {
  return root.querySelector(SELECTORS.commentsSection);
}

/**
 * Every comment and loaded reply under `root`, in document order (each reply
 * right after the comment it belongs to). Threads without text are skipped.
 */
export function readComments(root: ParentNode): ReadComment[] {
  const result: ReadComment[] = [];
  for (const thread of root.querySelectorAll(SELECTORS.thread)) {
    const own = thread.querySelector(SELECTORS.ownComment);
    const content = own?.querySelector(SELECTORS.contentText);
    if (!own || !content) continue;

    result.push({
      comment: {
        text: textOf(content).trim(),
        author: handleFrom(own.querySelector(SELECTORS.authorLink)),
        isReply: thread.hasAttribute(SELECTORS.replyAttribute),
      },
      element: thread,
    });
  }
  return result;
}

/** The video owner's channel handle, e.g. "@channel", or `null` if it is not on the page. */
export function readVideoOwner(root: ParentNode): string | null {
  return handleFrom(root.querySelector(SELECTORS.videoOwnerLink)) || null;
}
