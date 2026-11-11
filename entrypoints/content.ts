import { messages } from '../src/i18n/index.ts';
import { createPanel, scanPage } from '../src/page/index.ts';
import { loadSettings, watchSettings } from '../src/storage/index.ts';

/**
 * Content script entry point.
 *
 * Declared for all of www.youtube.com, not only /watch and /shorts, because
 * YouTube navigates between pages without a full reload: a script limited to
 * video URLs would never load when the viewer opens a video from the home
 * page. See docs/decisions/0002-content-script-injection.md.
 *
 * Increment 5: on a video page, show the floating panel and scan when the
 * viewer presses the button. Reading and highlighting only: this script never
 * clicks, submits or changes YouTube's own controls.
 */
export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  async main(ctx) {
    if (location.pathname !== '/watch') return;

    let settings = await loadSettings();
    const panel = createPanel(document, messages[settings.language], () => {
      panel.showResult(scanPage(document, settings));
    });

    const unwatch = watchSettings((next) => {
      settings = next;
      panel.setMessages(messages[next.language]);
    });

    ctx.onInvalidated(() => {
      unwatch();
      panel.destroy();
    });
  },
});
