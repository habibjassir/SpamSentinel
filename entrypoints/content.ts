/**
 * Content script entry point.
 *
 * Declared for all of www.youtube.com, not only /watch and /shorts, because
 * YouTube navigates between pages without a full reload: a script limited to
 * video URLs would never load when the viewer opens a video from the home
 * page. Later increments check the URL and only act on video and Shorts pages.
 * See docs/decisions/0002-content-script-injection.md.
 */
export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  main() {
    // Increment 0: intentionally empty.
  },
});
