/**
 * What `webextension-polyfill` resolves to in Storybook (see
 * .storybook/vite.config.ts): one fake browser for the whole preview,
 * reseeded before each story. It's also the global `browser`, which the
 * app's i18n reads directly.
 */
import { createFakeBrowser, type FakeBrowserSeed } from "./fakeBrowser";

const fakeBrowser = createFakeBrowser();

/**
 * Replaces the fake browser's Bookmarks, Tabs and storage with `seed`. The
 * `browser` object stays the same, since app modules keep hold of it.
 */
export const resetFakeBrowser = (seed?: FakeBrowserSeed) =>
  fakeBrowser.reset(seed);

const browser = fakeBrowser.browser;
Object.assign(globalThis, { browser });

export default browser;
export const { bookmarks, i18n, runtime, storage, tabs, windows } = browser;
