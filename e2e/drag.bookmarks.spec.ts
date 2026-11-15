import type { DragPosition } from "../src/components/drag/dragTypes";
import type { Page } from "@playwright/test";
import { drag } from "./support/drag";
import {
  bookmarks,
  expect,
  expectRootFolder,
  expectUnchanged,
  test,
  type SeedNode,
} from "./support/extension";
import type { TitleTree } from "./support/seed";

const EIGHT = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"];

type Kind = "Bookmark" | "Folder";

/** A Bookmark, or a Folder holding one Bookmark. */
const node = (kind: Kind, title: string) => {
  const seed: SeedNode =
    kind === "Bookmark"
      ? bookmarks(title)[0]
      : { title, children: bookmarks(`Inner ${title}`) };
  const tree: TitleTree[number] =
    kind === "Bookmark" ? title : { [title]: [`Inner ${title}`] };
  return { seed, tree };
};

const BEFORE_D = ["B1", "B2", "B3", "B4", "B5", "B6"];

/**
 * Drag Source S starts at index 0; Drop Destination D is at index 7, which
 * at six columns is column 2 of row 2. Each outcome is the Root Folder's
 * order after the drop.
 */
const MATRIX_OUTCOMES: Record<DragPosition, string[]> = {
  // Start of D's row (index 6), less one for S leaving from before it.
  top: ["B1", "B2", "B3", "B4", "B5", "S", "B6", "D", "B8"],
  // Start of the row after D's, which is past the end, so S appends.
  bottom: [...BEFORE_D, "D", "B8", "S"],
  left: [...BEFORE_D, "S", "D", "B8"],
  right: [...BEFORE_D, "D", "S", "B8"],
  // On a Bookmark, "in" takes D's index with no adjustment, so S lands
  // after D. On a Folder it moves S inside instead (see below).
  in: [...BEFORE_D, "D", "S", "B8"],
};

const KINDS: Kind[] = ["Bookmark", "Folder"];
const POSITIONS = Object.keys(MATRIX_OUTCOMES) as DragPosition[];

test.describe("every Drag Source, Drop Destination and Drop Position at 1280×800", () => {
  for (const sourceKind of KINDS)
    for (const destinationKind of KINDS)
      for (const position of POSITIONS)
        test(`a ${sourceKind} dropped ${position} a ${destinationKind}`, async ({
          openHomebooks,
        }) => {
          const source = node(sourceKind, `${sourceKind} S`);
          const destination = node(destinationKind, `${destinationKind} D`);
          const homebooks = await openHomebooks([
            source.seed,
            ...bookmarks(...BEFORE_D),
            destination.seed,
            ...bookmarks("B8"),
          ]);

          await drag(homebooks.item(`${sourceKind} S`), {
            onto: homebooks.item(`${destinationKind} D`),
            at: position,
          });

          const titleOf = (title: string) =>
            title === "S"
              ? source.tree
              : title === "D"
                ? destination.tree
                : title;
          const expected =
            position === "in" && destinationKind === "Folder"
              ? [
                  ...BEFORE_D,
                  { "Folder D": ["Inner Folder D", source.tree] },
                  "B8",
                ]
              : MATRIX_OUTCOMES[position].map(titleOf);
          await expectRootFolder(homebooks, expected);
        });
});

test.describe("at 1280×800, six columns", () => {
  test("a Bookmark dropped to the right of a later Bookmark lands after it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks(...EIGHT));

    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B3"),
      at: "right",
    });

    await expectRootFolder(homebooks, [
      "B2",
      "B3",
      "B1",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
    ]);
  });

  test("a Bookmark dropped to the left of an earlier Bookmark lands before it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks(...EIGHT));

    await drag(homebooks.item("B5"), {
      onto: homebooks.item("B2"),
      at: "left",
    });

    await expectRootFolder(homebooks, [
      "B1",
      "B5",
      "B2",
      "B3",
      "B4",
      "B6",
      "B7",
      "B8",
    ]);
  });

  test("a Bookmark dropped on the bottom of a first-row Bookmark lands at the start of the next row", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks(...EIGHT));

    // B2 is column 2 of row 1, so the next row starts at index 6. B1 leaving
    // from before it shifts that to 5.
    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B2"),
      at: "bottom",
    });

    await expectRootFolder(homebooks, [
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B1",
      "B7",
      "B8",
    ]);
  });

  test("a Bookmark dropped on the top of a second-row Bookmark lands at the start of that row", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks(...EIGHT, "B9"));

    // B8 is column 2 of row 2, which starts at index 6.
    await drag(homebooks.item("B9"), { onto: homebooks.item("B8"), at: "top" });

    await expectRootFolder(homebooks, [
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B9",
      "B7",
      "B8",
    ]);
  });

  test("a Bookmark dropped in a Folder shows in that Folder's count", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      { title: "Folder A", children: [] },
      ...bookmarks("Example"),
    ]);

    await drag(homebooks.item("Example"), {
      onto: homebooks.item("Folder A"),
      at: "in",
    });

    await expectRootFolder(homebooks, [{ "Folder A": ["Example"] }]);
    await expect(homebooks.item("Folder A")).toContainText("1 Bookmark");
  });

  test(
    "an empty Folder can be dragged",
    async ({ openHomebooks }) => {
      const homebooks = await openHomebooks([
        { title: "Folder A", children: [] },
        ...bookmarks("B1", "B2"),
      ]);

      await drag(homebooks.item("Folder A"), {
        onto: homebooks.item("B1"),
        at: "right",
      });

      await expect
        .poll(homebooks.bookmarkTree, { timeout: 2_000 })
        .toEqual(["B1", { "Folder A": [] }, "B2"]);
    },
  );
});

test.describe("at 900×800, three columns", () => {
  const viewport = { width: 900, height: 800 };

  test("a Bookmark dropped on the bottom of a first-row Bookmark lands at the start of the next row", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks(...EIGHT), { viewport });

    // Next row starts at index 3; B1 leaving shifts it to 2.
    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B2"),
      at: "bottom",
    });

    await expectRootFolder(homebooks, [
      "B2",
      "B3",
      "B1",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
    ]);
  });

  test("a Bookmark dropped on the top of a second-row Bookmark lands at the start of that row", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks(...EIGHT), { viewport });

    // B5 is column 2 of row 2, which starts at index 3.
    await drag(homebooks.item("B8"), { onto: homebooks.item("B5"), at: "top" });

    await expectRootFolder(homebooks, [
      "B1",
      "B2",
      "B3",
      "B8",
      "B4",
      "B5",
      "B6",
      "B7",
    ]);
  });
});

test.describe("between Folders", () => {
  test("a Bookmark dragged out of an expanded Folder lands beside a top-level Bookmark", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(
      [{ title: "Folder A", children: bookmarks("Inner") }, ...bookmarks("B1")],
      { expanded: ["Folder A"] },
    );

    await drag(homebooks.item("Inner"), {
      onto: homebooks.item("B1"),
      at: "left",
    });

    await expectRootFolder(homebooks, [{ "Folder A": [] }, "Inner", "B1"]);
  });

  test("a top-level Bookmark dropped beside a Bookmark in an expanded Folder moves into that Folder", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(
      [
        { title: "Folder A", children: bookmarks("Inner 1", "Inner 2") },
        ...bookmarks("B1"),
      ],
      { expanded: ["Folder A"] },
    );

    await drag(homebooks.item("B1"), {
      onto: homebooks.item("Inner 1"),
      at: "right",
    });

    await expectRootFolder(homebooks, [
      { "Folder A": ["Inner 1", "B1", "Inner 2"] },
    ]);
  });

  test("a Folder moves to the bottom row of an expanded Folder (#1)", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(
      [
        {
          title: "Folder P",
          children: [
            { title: "Folder S", children: bookmarks("Inner S") },
            ...bookmarks("P1", "P2", "P3", "P4", "P5", "P6"),
          ],
        },
      ],
      { expanded: ["Folder P"] },
    );

    await drag(homebooks.item("Folder S"), {
      onto: homebooks.item("P6"),
      at: "right",
    });

    await expectRootFolder(homebooks, [
      {
        "Folder P": [
          "P1",
          "P2",
          "P3",
          "P4",
          "P5",
          "P6",
          { "Folder S": ["Inner S"] },
        ],
      },
    ]);
  });
});

test.describe("drops that change nothing", () => {
  const SEED = bookmarks("B1", "B2", "B3");
  const UNCHANGED = ["B1", "B2", "B3"];

  test("dropping a Bookmark on itself", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(SEED);

    await drag(homebooks.item("B2"), { onto: homebooks.item("B2"), at: "in" });

    await expectUnchanged(homebooks.bookmarkTree, UNCHANGED);
  });

  for (const [onto, at] of [
    ["B3", "left"],
    ["B1", "right"],
  ] as const)
    test(`dropping a Bookmark back where it started, ${at} of its neighbour`, async ({
      openHomebooks,
    }) => {
      const homebooks = await openHomebooks(SEED);

      await drag(homebooks.item("B2"), { onto: homebooks.item(onto), at });

      await expectUnchanged(homebooks.bookmarkTree, UNCHANGED);
    });

  test("cancelling with Escape mid-drag", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(SEED);

    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B3"),
      at: "right",
      beforeRelease: () => homebooks.page.keyboard.press("Escape"),
    });

    await expectUnchanged(homebooks.bookmarkTree, UNCHANGED);
    await expect(homebooks.dropIndicator).not.toBeInViewport();
  });

  test("releasing outside any Drop Destination", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(SEED);

    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B3"),
      at: "right",
      beforeRelease: () => moveToEmptySpace(homebooks.page),
    });

    await expectUnchanged(homebooks.bookmarkTree, UNCHANGED);
  });
});

test.describe("the drop indicator", () => {
  test("shows over a valid Drop Destination and clears after the drop", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2", "B3"));

    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B3"),
      at: "right",
      beforeRelease: () => expect(homebooks.dropIndicator).toBeInViewport(),
    });

    await expect(homebooks.dropIndicator).not.toBeInViewport();
  });

  test("clears when the drag leaves every Drop Destination", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2", "B3"));

    await drag(homebooks.item("B1"), {
      onto: homebooks.item("B3"),
      at: "right",
      beforeRelease: async () => {
        await expect(homebooks.dropIndicator).toBeInViewport();
        await moveToEmptySpace(homebooks.page);
        await expect(homebooks.dropIndicator).not.toBeInViewport();
      },
    });
  });
});

/**
 * Moves mid-drag to the bottom-left of the main view, below every item and
 * outside the windows column, where there's no Drop Destination.
 */
const moveToEmptySpace = async (page: Page) => {
  const main = (await page.locator("main").boundingBox())!;
  await page.mouse.move(main.x + 100, main.y + main.height - 20, { steps: 5 });
};
