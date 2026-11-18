// First, so the global `browser` exists before any app module reads it.
import { resetFakeBrowser } from "./fakeBrowser/webextensionPolyfill";
import type { Preview } from "@storybook/react-vite";
import type { FakeBrowserSeed } from "./fakeBrowser/fakeBrowser";
import { SAMPLE_BROWSER } from "./fakeBrowser/sampleData";
import { loadFonts } from "./fonts";
import "../src/pages/global.css";

/**
 * Forgets the page caches a previous story left in localStorage (see
 * bookmarkCache and storageMirror), so each story starts from its own data.
 */
const clearPageCaches = () => {
  for (const key of Object.keys(localStorage))
    if (key.startsWith("homebooks.")) localStorage.removeItem(key);
};

const preview: Preview = {
  parameters: {
    // The fake browser's contents. A story's `browser` parameter replaces
    // any of these keys.
    browser: SAMPLE_BROWSER,
  },
  beforeAll: loadFonts,
  beforeEach: ({ parameters }) => {
    clearPageCaches();
    resetFakeBrowser(parameters.browser as FakeBrowserSeed);
  },
};

export default preview;
