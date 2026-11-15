import type { BrowserContext, Page, Worker } from "@playwright/test";

export type Viewport = { width: number; height: number };

/**
 * Opens Homebooks as the only page and waits until the Root Folder's last
 * item (index `itemCount - 1`) renders.
 */
export const openHomepage = async (
  context: BrowserContext,
  {
    url,
    viewport,
    itemCount,
  }: { url: string; viewport?: Viewport; itemCount: number },
) => {
  const page = await context.newPage();
  // Playwright's starting about:blank tab would otherwise share the
  // Homebooks window.
  for (const other of context.pages()) if (other !== page) await other.close();
  if (viewport) await page.setViewportSize(viewport);
  await page.goto(url);
  await page
    .locator(`[data-drag-id][data-index="${itemCount - 1}"]`)
    .first()
    .waitFor();
  return page;
};

/**
 * Locators for the main view. Drag Sources and Drop Destinations are found
 * by the app's own drag ids: tiles have no role or accessible name of their
 * own, and the drag id is the contract drag and drop runs on.
 */
export const homepageLocators = (page: Page, ids: Record<string, string>) => ({
  /** A Bookmark or Folder in the main view (the Folder Select's lack data-index). */
  item: (title: string) =>
    page.locator(
      `[data-drag-id="bookmark-${ids[title]}"][data-index], [data-drag-id="folder-${ids[title]}"][data-index]`,
    ),
  tab: (id: number) => page.locator(`[data-drag-id="tab-${id}"]`),
  window: (id: number) => page.locator(`[data-drag-id="window-${id}"]`),
  /** Where a Window is grabbed: pressing elsewhere grabs one of its tabs. */
  windowHeader: (id: number) =>
    page.locator(`[data-drag-id="window-${id}"] header`).first(),
  dropIndicator: page.locator('main > [aria-hidden="true"]'),
});

/**
 * Titles of the Root Folder's items in the order the main view shows them,
 * looked up through the real bookmarks API so new bookmarks resolve too.
 */
export const readRenderedOrder = async (page: Page, serviceWorker: Worker) => {
  const nodeIds = await page
    .locator("[data-index]")
    .first()
    .locator("xpath=..")
    .locator(":scope > [data-drag-id][data-index]")
    .evaluateAll((elements) =>
      elements.map((element) =>
        element.getAttribute("data-drag-id")!.replace(/^\w+-/, ""),
      ),
    );
  return serviceWorker.evaluate(async (nodeIds) => {
    const nodes: chrome.bookmarks.BookmarkTreeNode[] = nodeIds.length
      ? await chrome.bookmarks.get(nodeIds as [string, ...string[]])
      : [];
    return nodes.map((node) => node.title);
  }, nodeIds);
};
