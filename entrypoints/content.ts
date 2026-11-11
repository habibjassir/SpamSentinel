import { createPageController } from '../src/page/index.ts';
import { loadSettings, watchSettings } from '../src/storage/index.ts';

/**
 * Content script entry point.
 *
 * Declared for all of www.youtube.com, not only /watch and /shorts, because
 * YouTube navigates between pages without a full reload: a script limited to
 * video URLs would never load when the viewer opens a video from the home
 * page. WXT's `wxt:locationchange` event reports those in-page navigations.
 * See docs/decisions/0002-content-script-injection.md.
 *
 * Reading and highlighting only: this script never clicks, submits or changes
 * YouTube's own controls.
 */
export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  async main(ctx) {
    const controller = createPageController(document, await loadSettings());
    controller.onLocation(location.href);

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      controller.onLocation(newUrl.href);
    });
    const unwatch = watchSettings((settings) => controller.updateSettings(settings));

    ctx.onInvalidated(() => {
      unwatch();
      controller.destroy();
    });
  },
});
