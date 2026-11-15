import { drag, hoverDuringDrag } from "./support/drag";
import { expect, test } from "./support/extension";

const SEED = [
  {
    title: "Folder A",
    children: [{ title: "Inner", url: "https://inner.example/" }],
  },
  { title: "B1", url: "https://b1.example/" },
];

test("hovering in a collapsed Folder for 700ms Peeks it open until the drag ends", async ({
  openHomebooks,
}) => {
  const { page, item } = await openHomebooks(SEED);
  await expect(item("Inner")).toHaveCount(0);

  await drag(item("B1"), {
    onto: item("Folder A"),
    at: "in",
    hold: 900,
    beforeRelease: async () => {
      await expect(item("Inner")).toBeVisible();
      await page.keyboard.press("Escape");
    },
  });

  await expect(item("Inner")).toHaveCount(0);
});

test("a shorter hover doesn't Peek", async ({ openHomebooks }) => {
  const { page, item } = await openHomebooks(SEED);

  await drag(item("B1"), {
    onto: item("Folder A"),
    at: "in",
    hold: 300,
    beforeRelease: async () => {
      await expect(item("Inner")).toHaveCount(0);
      await page.keyboard.press("Escape");
    },
  });
});

test("a Bookmark can be dropped beside a Bookmark inside a Peeked Folder", async ({
  openHomebooks,
}) => {
  const { item, bookmarkTree } = await openHomebooks(SEED);

  await drag(item("B1"), {
    onto: item("Folder A"),
    at: "in",
    hold: 900,
    beforeRelease: async () => {
      await hoverDuringDrag({ onto: item("Inner"), at: "right", hold: 200 });
    },
  });

  await expect.poll(bookmarkTree).toEqual([{ "Folder A": ["Inner", "B1"] }]);
});

test("a Folder inside a Peeked Folder Peeks open too", async ({
  openHomebooks,
}) => {
  const { page, item } = await openHomebooks([
    {
      title: "Folder A",
      children: [
        {
          title: "Folder B",
          children: [{ title: "Deep", url: "https://deep.example/" }],
        },
      ],
    },
    { title: "B1", url: "https://b1.example/" },
  ]);

  await drag(item("B1"), {
    onto: item("Folder A"),
    at: "in",
    hold: 900,
    beforeRelease: async () => {
      await hoverDuringDrag({ onto: item("Folder B"), at: "in", hold: 900 });
      await expect(item("Deep")).toBeVisible();
      await page.keyboard.press("Escape");
    },
  });
});
