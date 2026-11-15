import { expect, test } from "./support/extension";

const SEED = [
  {
    title: "Folder A",
    children: [
      {
        title: "Folder B",
        children: [{ title: "Deep Page", url: "https://deep.example/" }],
      },
    ],
  },
  { title: "Alpha", url: "https://first.example/" },
  { title: "Beta", url: "https://zebra.example/" },
];

test.describe("search", () => {
  for (const [query, shown, why] of [
    ["alpha", ["Alpha"], "a Bookmark by title"],
    ["zebra", ["Beta"], "a Bookmark by URL alone"],
    [
      "deep",
      ["Folder A", "Folder B", "Deep Page"],
      "a nested Bookmark with its parent Folders",
    ],
  ] as const)
    test(`shows ${why}`, async ({ openHomebooks }) => {
      const homebooks = await openHomebooks(SEED);

      await homebooks.searchbox.fill(query);

      await expect.poll(homebooks.shownItems).toEqual(shown);
    });

  test("shows nothing, and says so, when nothing matches", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(SEED);

    await homebooks.searchbox.fill("qqqxxx");

    await expect.poll(homebooks.shownItems).toEqual([]);
    await expect(
      homebooks.page.getByText("No bookmarks match your search."),
    ).toBeVisible();
  });

  test("Clear search restores the full tree", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(SEED);
    await homebooks.searchbox.fill("alpha");
    await expect.poll(homebooks.shownItems).toEqual(["Alpha"]);

    await homebooks.page.getByRole("button", { name: "Clear search" }).click();

    await expect(homebooks.searchbox).toHaveValue("");
    await expect
      .poll(homebooks.shownItems)
      .toEqual(["Folder A", "Alpha", "Beta"]);
  });
});
