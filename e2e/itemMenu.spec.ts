import {
  bookmarks,
  expect,
  expectRootFolder,
  readClipboard,
  test,
  writeClipboardHtml,
  type HomebooksPage,
} from "./support/extension";

const FOLDER_A = { title: "Folder A", children: bookmarks("Inner") };

/** Every tab URL across all windows. */
const allTabUrls = async (homebooks: HomebooksPage) =>
  Object.values(await homebooks.openTabUrls()).flat();

test.describe("opening a Bookmark", () => {
  test("Open in New Tab opens its URL in a tab", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));

    await homebooks.chooseItemMenuAction("B1", "Open in New Tab");

    await expect
      .poll(() => allTabUrls(homebooks))
      .toContain("https://b1.example/");
  });

  test("Open in New Window opens its URL in a new window", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    const windowIdsBefore = await homebooks.windowIds();

    await homebooks.chooseItemMenuAction("B1", "Open in New Window");

    await expect
      .poll(() => homebooks.newWindowsTabUrls(windowIdsBefore))
      .toEqual([["https://b1.example/"]]);
  });
});

test.describe("deleting, with no confirmation (#41)", () => {
  test("Delete Bookmark removes it", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2"));

    await homebooks.chooseItemMenuAction("B1", "Delete Bookmark");

    await expectRootFolder(homebooks, ["B2"]);
  });

  test("Delete Folder removes it with its contents", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([FOLDER_A, ...bookmarks("B1")]);

    await homebooks.chooseItemMenuAction("Folder A", "Delete Folder");

    await expectRootFolder(homebooks, ["B1"]);
  });
});

test.describe("copying to the clipboard", () => {
  // Chromium normalises written HTML (wraps it, lowercases tags), so these
  // check that Homebooks' markup is in it.
  test("Copy puts a Bookmark's URL and link on the clipboard", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));

    await homebooks.chooseItemMenuAction("B1", "Copy");

    await expect
      .poll(() => readClipboard(homebooks.page))
      .toEqual({
        "text/plain": "https://b1.example/",
        "text/html": expect.stringContaining(
          '<a href="https://b1.example/">B1</a>',
        ),
      });
  });

  test("Copy Folder puts its tree on the clipboard (Homebooks half of #3)", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([FOLDER_A]);

    await homebooks.chooseItemMenuAction("Folder A", "Copy Folder");

    await expect
      .poll(() => readClipboard(homebooks.page))
      .toEqual({
        "text/plain": "Folder A\nhttps://inner.example/\n",
        "text/html": expect.stringContaining(
          '<dl><dt>Folder A</dt><dd><a href="https://inner.example/">Inner</a></dd></dl>',
        ),
      });
  });
});

test.describe("pasting", () => {
  test("a copied Bookmark pasted on a Bookmark lands right after it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2", "B3"));

    await homebooks.chooseItemMenuAction("B1", "Copy");
    await homebooks.chooseItemMenuAction("B2", "Paste");

    await expect.poll(homebooks.bookmarkTree).toEqual(["B1", "B2", "B1", "B3"]);
  });

  test("a copied Bookmark pasted on a Folder lands inside it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([FOLDER_A, ...bookmarks("B1")]);

    await homebooks.chooseItemMenuAction("B1", "Copy");
    await homebooks.chooseItemMenuAction("Folder A", "Paste");

    await expect
      .poll(homebooks.bookmarkTree)
      .toEqual([{ "Folder A": ["Inner", "B1"] }, "B1"]);
  });

  test("a cut Bookmark pasted on a Bookmark moves there", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2", "B3"));

    await homebooks.chooseItemMenuAction("B1", "Cut");
    await expectRootFolder(homebooks, ["B2", "B3"]);
    await homebooks.chooseItemMenuAction("B3", "Paste");

    await expectRootFolder(homebooks, ["B2", "B3", "B1"]);
  });

  test("a copied Folder pasted on a Folder nests inside it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      FOLDER_A,
      { title: "Folder B", children: [] },
    ]);

    await homebooks.chooseItemMenuAction("Folder A", "Copy Folder");
    await homebooks.chooseItemMenuAction("Folder B", "Paste");

    await expect
      .poll(homebooks.bookmarkTree)
      .toEqual([
        { "Folder A": ["Inner"] },
        { "Folder B": [{ "Folder A": ["Inner"] }] },
      ]);
  });

  test("a cut Folder pasted on a Folder moves inside it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      FOLDER_A,
      { title: "Folder B", children: [] },
    ]);

    await homebooks.chooseItemMenuAction("Folder A", "Cut Folder");
    await expectRootFolder(homebooks, [{ "Folder B": [] }]);
    await homebooks.chooseItemMenuAction("Folder B", "Paste");

    await expectRootFolder(homebooks, [
      { "Folder B": [{ "Folder A": ["Inner"] }] },
    ]);
  });

  test("a link copied from another app pastes as a Bookmark", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2"));
    await writeClipboardHtml(
      homebooks.page,
      '<a href="https://elsewhere.example/">Elsewhere</a>',
    );

    await homebooks.chooseItemMenuAction("B1", "Paste");

    await expect
      .poll(homebooks.bookmarkTree)
      .toEqual(["B1", "Elsewhere", "B2"]);
    expect(await homebooks.bookmarkUrl("Elsewhere")).toBe(
      "https://elsewhere.example/",
    );
  });
});
