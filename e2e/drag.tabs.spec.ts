import type { DragPosition } from "../src/components/drag/dragTypes";
import { drag } from "./support/drag";
import {
  bookmarks,
  expect,
  expectRootFolder,
  expectUnchanged,
  tabUrl,
  test,
  type HomebooksPage,
} from "./support/extension";

const BEFORE_D = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"];

/**
 * The Tab starts outside the Root Folder, so no same-parent adjustment
 * applies. The Drop Destination D is at index 7: at six columns, column 2
 * of row 2.
 */
const TAB_OUTCOMES: Record<Exclude<DragPosition, "in">, string[]> = {
  // Start of D's row.
  top: ["B1", "B2", "B3", "B4", "B5", "B6", "Tab A", "B7", "D"],
  // Start of the next row, past the end, so it appends.
  bottom: [...BEFORE_D, "D", "Tab A"],
  left: [...BEFORE_D, "Tab A", "D"],
  right: [...BEFORE_D, "D", "Tab A"],
};

test.describe("a Tab dropped on bookmarks becomes a bookmark and closes", () => {
  for (const destinationKind of ["Bookmark", "Folder"] as const)
    for (const position of ["top", "bottom", "left", "right", "in"] as const)
      test(`dropped ${position} a ${destinationKind}`, async ({
        openHomebooks,
      }) => {
        const isFolder = destinationKind === "Folder";
        const homebooks = await openHomebooks([
          ...bookmarks(...BEFORE_D),
          isFolder
            ? { title: "D", children: bookmarks("Inner") }
            : bookmarks("D")[0],
        ]);
        const { tabIds } = await homebooks.openTabs(["Tab A"]);

        await drag(homebooks.tab(tabIds["Tab A"]), {
          onto: homebooks.item("D"),
          at: position,
        });

        const destination = isFolder ? { D: ["Inner"] } : "D";
        const expected =
          position === "in"
            ? isFolder
              ? [...BEFORE_D, { D: ["Inner", "Tab A"] }]
              : // On a Bookmark, "in" takes D's index, so it lands before D.
                [...BEFORE_D, "Tab A", "D"]
            : TAB_OUTCOMES[position].map((title) =>
                title === "D" ? destination : title,
              );
        await expectRootFolder(homebooks, expected);
        expect(await homebooks.bookmarkUrl("Tab A")).toBe(tabUrl("Tab A"));
        await expect.poll(homebooks.openTabIds).not.toContain(tabIds["Tab A"]);
      });
});

test.describe("a Window dropped on bookmarks", () => {
  test("bookmarks each of its tabs in order and closes them", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      { title: "Folder A", children: [] },
    ]);
    const titles = ["Tab 1", "Tab 2", "Tab 3"];
    const { windowId, tabIds } = await homebooks.openTabs(titles);

    await drag(homebooks.windowHeader(windowId), {
      onto: homebooks.item("Folder A"),
      at: "in",
    });

    await expectRootFolder(homebooks, [{ "Folder A": titles }]);
    const urls = await homebooks.bookmarkUrls();
    expect(titles.map((title) => urls[title])).toEqual(titles.map(tabUrl));
    await expect
      .poll(async () =>
        (await homebooks.openTabIds()).filter((id) =>
          Object.values(tabIds).includes(id),
        ),
      )
      .toEqual([]);
  });

  test("keeps the Homebooks tab open when it shares that window", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      { title: "Folder A", children: [] },
    ]);
    const { windowId, tabIds } = await homebooks.openTabs(["Tab 1", "Tab 2"], {
      inHomebooksWindow: true,
    });
    const homebooksTabs = (await homebooks.openTabIds()).filter(
      (id) => !Object.values(tabIds).includes(id),
    );

    await drag(homebooks.windowHeader(windowId), {
      onto: homebooks.item("Folder A"),
      at: "in",
    });

    await expectRootFolder(homebooks, [{ "Folder A": ["Tab 1", "Tab 2"] }]);
    await expect.poll(homebooks.openTabIds).toEqual(homebooksTabs);
    await expect(homebooks.page).toHaveURL(/homepage\.html$/);
  });

  test("skips browser-internal tabs the windows column hides (#39)", async ({
    openHomebooks,
    serviceWorker,
  }) => {
    const homebooks = await openHomebooks([
      { title: "Folder A", children: [] },
    ]);
    const { windowId, tabIds } = await homebooks.openTabs(["Tab 1"]);
    const hiddenTabId = await serviceWorker.evaluate(
      async (windowId) =>
        (await chrome.tabs.create({ windowId, url: "about:blank" })).id!,
      windowId,
    );

    await drag(homebooks.windowHeader(windowId), {
      onto: homebooks.item("Folder A"),
      at: "in",
    });

    await expect.poll(homebooks.openTabIds).not.toContain(tabIds["Tab 1"]);
    await expectRootFolder(homebooks, [{ "Folder A": ["Tab 1"] }]);
    await expectUnchanged(homebooks.bookmarkTree, [{ "Folder A": ["Tab 1"] }]);
    // Neither bookmarked nor closed.
    expect(await homebooks.openTabIds()).toContain(hiddenTabId);
  });
});

test("keeps a dropped Tab open when its Bookmark can't be created (#53)", async ({
  context,
  openHomebooks,
}) => {
  // Every Bookmark create fails, as it would if the browser refused it. The
  // polyfill calls this inside a Promise, so the throw becomes a rejection.
  await context.addInitScript(() => {
    const page = window as unknown as { refusedCreates: number };
    page.refusedCreates = 0;
    chrome.bookmarks.create = (() => {
      page.refusedCreates++;
      throw new Error("create refused");
    }) as typeof chrome.bookmarks.create;
  });
  const homebooks = await openHomebooks([{ title: "Folder A", children: [] }]);
  const errors: string[] = [];
  homebooks.page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const uncaught: Error[] = [];
  homebooks.page.on("pageerror", (error) => uncaught.push(error));
  const { tabIds } = await homebooks.openTabs(["Tab A"]);

  await drag(homebooks.tab(tabIds["Tab A"]), {
    onto: homebooks.item("Folder A"),
    at: "in",
  });

  await expect
    .poll(() =>
      homebooks.page.evaluate(
        () => (window as unknown as { refusedCreates: number }).refusedCreates,
      ),
    )
    .toBe(1);
  await expect
    .poll(() => errors.some((text) => text.includes("create refused")))
    .toBe(true);
  await expectUnchanged(homebooks.bookmarkTree, [{ "Folder A": [] }]);
  expect(await homebooks.openTabIds()).toContain(tabIds["Tab A"]);
  expect(uncaught).toEqual([]);
});

/** Bookmarks and open tabs together, so one check covers both. */
const readState = async (homebooks: HomebooksPage) => ({
  bookmarks: await homebooks.bookmarkTree(),
  tabs: await homebooks.openTabIds(),
});

test.describe("drops onto Tabs and Windows change nothing", () => {
  type Opened = {
    sourceWindow: number;
    sourceTab: number;
    otherWindow: number;
    otherTab: number;
  };

  const SOURCES = {
    Bookmark: (homebooks: HomebooksPage) => homebooks.item("B1"),
    Folder: (homebooks: HomebooksPage) => homebooks.item("Folder A"),
    Tab: (homebooks: HomebooksPage, opened: Opened) =>
      homebooks.tab(opened.sourceTab),
    Window: (homebooks: HomebooksPage, opened: Opened) =>
      homebooks.windowHeader(opened.sourceWindow),
  };
  const DESTINATIONS = {
    Tab: (homebooks: HomebooksPage, opened: Opened) =>
      ({ onto: homebooks.tab(opened.otherTab), at: "right" }) as const,
    Window: (homebooks: HomebooksPage, opened: Opened) =>
      ({ onto: homebooks.window(opened.otherWindow), at: "in" }) as const,
  };

  for (const [sourceKind, source] of Object.entries(SOURCES))
    for (const [destinationKind, destination] of Object.entries(DESTINATIONS))
      test(`a ${sourceKind} dropped on a ${destinationKind} in another window`, async ({
        openHomebooks,
      }) => {
        const homebooks = await openHomebooks([
          { title: "Folder A", children: bookmarks("Inner") },
          ...bookmarks("B1"),
        ]);
        const first = await homebooks.openTabs(["Tab A"]);
        const second = await homebooks.openTabs(["Tab B"]);
        const opened = {
          sourceWindow: first.windowId,
          sourceTab: first.tabIds["Tab A"],
          otherWindow: second.windowId,
          otherTab: second.tabIds["Tab B"],
        };
        const before = await readState(homebooks);

        await drag(source(homebooks, opened), destination(homebooks, opened));

        await expectUnchanged(() => readState(homebooks), before);
      });
});
