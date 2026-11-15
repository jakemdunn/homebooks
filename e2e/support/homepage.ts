import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type Worker,
} from "@playwright/test";

export type Viewport = { width: number; height: number };

/**
 * Selects Bookmark and Folder tiles in the main view, optionally one node's
 * or the one at an index. The Folder Select's tiles lack data-index.
 */
const itemTileSelector = ({
  id,
  index,
}: { id?: string; index?: number } = {}) =>
  (["bookmark", "folder"] as const)
    .map((type) => {
      const dragId = id
        ? `[data-drag-id="${type}-${id}"]`
        : `[data-drag-id^="${type}-"]`;
      const position =
        index === undefined ? "[data-index]" : `[data-index="${index}"]`;
      return dragId + position;
    })
    .join(", ");

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
    .locator(itemTileSelector({ index: itemCount - 1 }))
    .first()
    .waitFor();
  await waitForViewTransitions(page);
  return page;
};

/**
 * Waits until no view transition is running. Folders animate with React's
 * <ViewTransition>, and while one runs its ::view-transition overlay takes
 * pointer input, so a click during the first renders after load can be lost.
 */
export const waitForViewTransitions = (page: Page) =>
  expect.poll(() => isQuiet(page)).toBe(true);

const viewTransitionRunning = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith(
          "::view-transition",
        ),
      ),
  );

/** A gap long enough for a render to start the next transition. */
const TRANSITION_GAP = 50;

/**
 * Quiet means no transition on two reads a gap apart: renders right after
 * load can start a new transition just as the last one ends.
 */
const isQuiet = async (page: Page) => {
  if (await viewTransitionRunning(page)) return false;
  await page.waitForTimeout(TRANSITION_GAP);
  return !(await viewTransitionRunning(page));
};

/**
 * Locators for the main view. Drag Sources and Drop Destinations are found
 * by the app's own drag ids: tiles have no role or accessible name of their
 * own, and the drag id is the contract drag and drop runs on.
 */
export const homepageLocators = (page: Page, ids: Record<string, string>) => ({
  /** A Bookmark or Folder in the main view. */
  item: (title: string) => page.locator(itemTileSelector({ id: ids[title] })),
  /** The button that opens an item's Item Menu, when Settings shows it. */
  itemMenuButton: (title: string) =>
    page
      .locator(itemTileSelector({ id: ids[title] }))
      .getByRole("button", { name: "Item menu" }),
  searchbox: page.getByRole("searchbox", { name: "Search bookmarks" }),
  tab: (id: number) => page.locator(`[data-drag-id="tab-${id}"]`),
  window: (id: number) => page.locator(`[data-drag-id="window-${id}"]`),
  /** Where a Window is grabbed: pressing elsewhere grabs one of its tabs. */
  windowHeader: (id: number) =>
    page.locator(`[data-drag-id="window-${id}"] header`).first(),
  dropIndicator: page.locator('main > [aria-hidden="true"]'),
  /** An action in the open Item Menu, by its exact label. */
  menuAction: (name: string) => page.getByRole("button", { name, exact: true }),
});

/**
 * Titles for bookmark node ids, looked up through the real bookmarks API so
 * new bookmarks resolve too.
 */
const titlesOf = (serviceWorker: Worker, nodeIds: string[]) =>
  serviceWorker.evaluate(
    (nodeIds) =>
      Promise.all(
        nodeIds.map((id) =>
          chrome.bookmarks.get(id).then(
            ([node]) => node.title,
            // A tile still showing for a just-removed node: the next poll
            // reads again.
            () => `(removed ${id})`,
          ),
        ),
      ),
    nodeIds,
  );

const nodeIdsOf = (tiles: Locator) =>
  tiles.evaluateAll((elements) =>
    elements.map((element) =>
      element.getAttribute("data-drag-id")!.replace(/^\w+-/, ""),
    ),
  );

/** Titles of the Root Folder's items in the order the main view shows them. */
export const readRenderedOrder = async (page: Page, serviceWorker: Worker) =>
  titlesOf(
    serviceWorker,
    await nodeIdsOf(
      page
        .locator("[data-index]")
        .first()
        .locator("xpath=..")
        .locator(":scope > [data-drag-id][data-index]"),
    ),
  );

/** Titles of every Bookmark and Folder the main view shows, at any depth. */
export const readShownItems = async (page: Page, serviceWorker: Worker) =>
  titlesOf(serviceWorker, await nodeIdsOf(page.locator(itemTileSelector())));
