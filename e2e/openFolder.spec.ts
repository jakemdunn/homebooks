import { bookmarks, expect, test } from "./support/extension";

/** Folder A holds One, then Folder B (holding Two), then Three. */
const SEED = [
  {
    title: "Folder A",
    children: [
      ...bookmarks("One"),
      { title: "Folder B", children: bookmarks("Two") },
      ...bookmarks("Three"),
    ],
  },
];

/** Folder A's Bookmark URLs, depth first, as the Folder lists them. */
const FOLDER_A_URLS = [
  "https://one.example/",
  "https://two.example/",
  "https://three.example/",
];

test.describe("opening a Folder's Bookmarks, nested Folders included", () => {
  test("Open folder into current window adds them as tabs to Homebooks' window", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(SEED);
    const homepage = homebooks.page.url();

    await homebooks.chooseItemMenuAction(
      "Folder A",
      "Open folder into current window",
    );

    await expect
      .poll(async () =>
        Object.values(await homebooks.openTabUrls()).find((urls) =>
          urls.includes(homepage),
        ),
      )
      .toEqual([homepage, ...FOLDER_A_URLS]);
  });

  test("Open folder into new window opens one window holding them", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(SEED);
    const windowIdsBefore = await homebooks.windowIds();

    await homebooks.chooseItemMenuAction(
      "Folder A",
      "Open folder into new window",
    );

    await expect
      .poll(() => homebooks.newWindowsTabUrls(windowIdsBefore))
      .toEqual([FOLDER_A_URLS]);
  });
});
