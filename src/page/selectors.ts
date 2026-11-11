// Every YouTube selector lives here and nowhere else (tests/unit/selectors-boundary.test.ts).
// When YouTube changes its page, recapture fixtures/page-*.html and adjust this file.
// Measured on 2026-11-10/11 on a normal video page.

export const SELECTORS = {
  /** Container of the whole comment section. Missing means the page structure changed. */
  commentsSection: 'ytd-comments#comments',
  /** One comment or reply. Replies are nested threads with the `is-sub-thread` attribute. */
  thread: 'ytd-comment-thread-renderer',
  /** Attribute that marks a thread as a reply. */
  replyAttribute: 'is-sub-thread',
  /** The thread's own comment, excluding its nested replies. Relative to a thread. */
  ownComment: ':scope > #comment-container',
  /** Author link; its href is the author's handle path ("/@handle"). Relative to ownComment. */
  authorLink: '#author-text',
  /** Comment text; emoji may be <img> elements with the emoji in `alt`. Relative to ownComment. */
  contentText: '#content-text',
  /** Channel link of the video owner. The author badge does not identify the owner. */
  videoOwnerLink: 'ytd-video-owner-renderer a[href^="/@"]',
} as const;
