import path from "node:path";
import {
  test as base,
  chromium,
  expect,
  type BrowserContext,
  type Worker,
} from "@playwright/test";
import {
  homepageLocators,
  openHomepage,
  readRenderedOrder,
  type Viewport,
} from "./homepage";
import {
  readBookmarkTree,
  readBookmarkUrls,
  seedRootFolder,
  type SeedNode,
} from "./seed";
import { createTabs, readOpenTabIds, tabUrl } from "./tabs";

const EXTENSION_PATH = path.resolve(import.meta.dirname, "../../dist-e2e");

type OpenOptions = {
  /** Titles of Folders to show expanded. */
  expanded?: string[];
  viewport?: Viewport;
};

type Fixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  /**
   * Creates a fresh Root Folder holding `nodes`, points the Root Folder
   * setting at it, and opens Homebooks.
   */
  openHomebooks: (
    nodes: SeedNode[],
    options?: OpenOptions,
  ) => Promise<HomebooksPage>;
};

export type HomebooksPage = Awaited<ReturnType<typeof homebooksPage>>;

const homebooksPage = async (
  {
    context,
    serviceWorker,
  }: { context: BrowserContext; serviceWorker: Worker },
  nodes: SeedNode[],
  { expanded = [], viewport }: OpenOptions = {},
) => {
  const { rootId, ids } = await seedRootFolder(serviceWorker, {
    nodes,
    expanded,
  });
  const url = new URL("/src/homepage.html", serviceWorker.url()).href;
  const page = await openHomepage(context, {
    url,
    viewport,
    itemCount: nodes.length,
  });
  const locators = homepageLocators(page, ids);
  return {
    page,
    ids,
    ...locators,
    bookmarkTree: () => readBookmarkTree(serviceWorker, rootId),
    bookmarkUrls: () => readBookmarkUrls(serviceWorker, rootId),
    renderedOrder: () => readRenderedOrder(page, serviceWorker),
    openTabIds: () => readOpenTabIds(serviceWorker),
    /** Opens tabs titled `titles` and waits until the windows column shows them. */
    openTabs: async (titles: string[], { inHomebooksWindow = false } = {}) => {
      const opened = await createTabs(serviceWorker, {
        urls: titles.map(tabUrl),
        inHomebooksWindow,
      });
      for (const [i, id] of opened.tabIds.entries())
        await expect(locators.tab(id)).toContainText(titles[i]);
      const tabIds = Object.fromEntries(
        titles.map((title, i) => [title, opened.tabIds[i]]),
      );
      return { windowId: opened.windowId, tabIds };
    },
  };
};

export const test = base.extend<Fixtures>({
  // A fresh profile per test, so no state leaks between tests.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      // Headless needs this channel to load extensions (Playwright 1.65,
      // Chromium 159); see playwright.config.ts.
      channel: "chromium",
      viewport: { width: 1280, height: 800 },
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    // homepage.html loads Nunito from Google Fonts with display=swap. The
    // grid's 25ch columns depend on the font, so whether and when it arrives
    // would change the column count, and with it top/bottom drop indexes.
    // Block it so the layout never depends on the network.
    await context.route(
      /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
      (route) => route.abort(),
    );
    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    const [existing] = context.serviceWorkers();
    await use(existing ?? (await context.waitForEvent("serviceworker")));
  },

  openHomebooks: async ({ context, serviceWorker }, use) => {
    await use((nodes, options) =>
      homebooksPage({ context, serviceWorker }, nodes, options),
    );
  },
});

export { expect };
export { bookmarks, urlFor, type SeedNode } from "./seed";
export { tabUrl } from "./tabs";
export { expectRootFolder, expectUnchanged } from "./assertions";
