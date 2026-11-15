import type { Page } from "@playwright/test";
import {
  bookmarks,
  expect,
  expectRootFolder,
  expectUnchanged,
  ROOT_FOLDER_TITLE,
  test,
  type HomebooksPage,
} from "./support/extension";

/** Opens Settings, runs `change`, and closes Settings again. */
const inSettings = async (page: Page, change: () => Promise<unknown>) => {
  const toggle = page.getByRole("button", { name: "Settings" });
  await toggle.click();
  await change();
  await toggle.click();
};

const chooseItemMenuTrigger = (homebooks: HomebooksPage, label: string) =>
  inSettings(homebooks.page, () =>
    homebooks.page
      .getByRole("combobox", { name: "Context Menu" })
      .selectOption({ label }),
  );

/** The Item Menu's first action: visible exactly when the Item Menu is open. */
const itemMenuFirstAction = (homebooks: HomebooksPage) =>
  homebooks.menuAction("Open in New Tab");

test.describe("the Item Menu trigger", () => {
  test("Right Click: right-clicking opens the Item Menu and no menu button shows", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    // The fixture starts on Right Click; leave it first so choosing it counts.
    await chooseItemMenuTrigger(homebooks, "On Item");
    await expect(homebooks.itemMenuButton("B1")).toBeVisible();
    await chooseItemMenuTrigger(homebooks, "Right Click");

    await expect(homebooks.itemMenuButton("B1")).toHaveCount(0);
    await homebooks.openItemMenu("B1");
    await expect(itemMenuFirstAction(homebooks)).toBeVisible();
  });

  test("On Item: the menu button opens the Item Menu", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    await chooseItemMenuTrigger(homebooks, "On Item");

    await homebooks.itemMenuButton("B1").click();

    await expect(itemMenuFirstAction(homebooks)).toBeVisible();
  });

  test("On Item: right-clicking doesn't open the Item Menu", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    await chooseItemMenuTrigger(homebooks, "On Item");

    await homebooks.openItemMenu("B1");

    await expectUnchanged(
      () => itemMenuFirstAction(homebooks).isVisible(),
      false,
    );
  });

  for (const opener of ["menu button", "right-click"] as const)
    test(`On Item and Right Click: the ${opener} opens the Item Menu`, async ({
      openHomebooks,
    }) => {
      const homebooks = await openHomebooks(bookmarks("B1"));
      await chooseItemMenuTrigger(homebooks, "On Item and Right Click");

      if (opener === "right-click") await homebooks.openItemMenu("B1");
      else await homebooks.itemMenuButton("B1").click();

      await expect(itemMenuFirstAction(homebooks)).toBeVisible();
    });
});

test("choosing another Root Folder shows that Folder's contents", async ({
  openHomebooks,
}) => {
  const homebooks = await openHomebooks([
    { title: "Folder A", children: bookmarks("Inner 1", "Inner 2") },
    ...bookmarks("B1"),
  ]);

  await inSettings(homebooks.page, async () => {
    const picker = homebooks.page.locator("section[data-settings]");
    await picker
      .getByRole("button", { name: `${ROOT_FOLDER_TITLE} subfolders` })
      .click();
    await picker.getByRole("button", { name: "Folder A", exact: true }).click();
  });

  await expect.poll(homebooks.shownItems).toEqual(["Inner 1", "Inner 2"]);
});

test("importing a Toby export creates its lists as Folders", async ({
  openHomebooks,
}) => {
  const homebooks = await openHomebooks(bookmarks("B1"));
  const tobyExport = {
    version: 4,
    groups: [
      {
        name: "My Collections",
        type: "personal",
        lists: [
          {
            title: "Reading",
            labelIds: [],
            cards: [
              {
                title: "Article",
                url: "https://article.example/",
                customTitle: "",
                customDescription: "",
                favIconUrl: "",
                description: "",
              },
            ],
          },
        ],
      },
    ],
    labels: {},
  };

  await inSettings(homebooks.page, async () => {
    const chooser = homebooks.page.waitForEvent("filechooser");
    await homebooks.page
      .getByRole("button", { name: "Import from Toby" })
      .click();
    await (
      await chooser
    ).setFiles({
      name: "toby-export.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(tobyExport)),
    });
  });

  await expectRootFolder(homebooks, ["B1", { Reading: ["Article"] }]);
  expect(await homebooks.bookmarkUrl("Article")).toBe(
    "https://article.example/",
  );
});
