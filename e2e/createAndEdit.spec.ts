import type { Page } from "@playwright/test";
import {
  bookmarks,
  expect,
  expectRootFolder,
  expectUnchanged,
  ROOT_FOLDER_TITLE,
  test,
} from "./support/extension";

const dialog = (page: Page, name: "New folder" | "New bookmark") =>
  page.getByRole("dialog", { name });

type CreateForm = {
  /** The parent the form starts with, as the picker titles it. */
  parent: string;
  fields: { Title?: string; URL?: string };
};

const fillAndSave = async (
  form: ReturnType<typeof dialog>,
  { parent, fields }: CreateForm,
) => {
  // Wait until the default parent shows as chosen, so the form is fully
  // loaded before typing.
  await expect(
    form.getByRole("button", { name: parent, exact: true, pressed: true }),
  ).toBeVisible();
  for (const [label, value] of Object.entries(fields))
    await form.getByRole("textbox", { name: label, exact: true }).fill(value);
  await form.getByRole("button", { name: "Save" }).click();
};

test.describe("creating", () => {
  test("Add Folder creates a Folder first in the Root Folder", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));

    await homebooks.page.getByRole("button", { name: "Add Folder" }).click();
    await fillAndSave(dialog(homebooks.page, "New folder"), {
      parent: ROOT_FOLDER_TITLE,
      fields: { Title: "Made" },
    });

    await expectRootFolder(homebooks, [{ Made: [] }, "B1"]);
  });

  test("saving closes the form", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));

    await homebooks.page.getByRole("button", { name: "Add Folder" }).click();
    await fillAndSave(dialog(homebooks.page, "New folder"), {
      parent: ROOT_FOLDER_TITLE,
      fields: { Title: "Made" },
    });

    await expect(dialog(homebooks.page, "New folder")).toBeHidden();
  });

  test("an empty Folder's prompt creates a Bookmark in that Folder", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(
      [{ title: "Empty", children: [] }, ...bookmarks("B1")],
      { expanded: ["Empty"] },
    );

    await homebooks.page
      .getByRole("button", { name: "create one now" })
      .click();
    await fillAndSave(dialog(homebooks.page, "New bookmark"), {
      parent: "Empty",
      fields: { Title: "Made", URL: "https://made.example/" },
    });

    await expectRootFolder(homebooks, [{ Empty: ["Made"] }, "B1"]);
    expect(await homebooks.bookmarkUrl("Made")).toBe("https://made.example/");
  });

  test("Create Bookmark in a Folder's Item Menu creates a Bookmark first in that Folder", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      { title: "Folder A", children: bookmarks("Inner") },
      ...bookmarks("B1"),
    ]);

    await homebooks.chooseItemMenuAction("Folder A", "Create Bookmark");
    await fillAndSave(dialog(homebooks.page, "New bookmark"), {
      parent: "Folder A",
      fields: { Title: "Made", URL: "https://made.example/" },
    });

    await expectRootFolder(homebooks, [
      { "Folder A": ["Made", "Inner"] },
      "B1",
    ]);
  });

  test("a missing title shows an error and creates nothing", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));

    await homebooks.page.getByRole("button", { name: "Add Folder" }).click();
    await fillAndSave(dialog(homebooks.page, "New folder"), {
      parent: ROOT_FOLDER_TITLE,
      fields: { Title: "  " },
    });

    await expect(dialog(homebooks.page, "New folder")).toContainText(
      "Title is required.",
    );
    await expectUnchanged(homebooks.bookmarkTree, ["B1"]);
  });

  test("a Bookmark without a URL shows an error and creates nothing", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([{ title: "Empty", children: [] }], {
      expanded: ["Empty"],
    });

    await homebooks.page
      .getByRole("button", { name: "create one now" })
      .click();
    await fillAndSave(dialog(homebooks.page, "New bookmark"), {
      parent: "Empty",
      fields: { Title: "Made", URL: "" },
    });

    await expect(dialog(homebooks.page, "New bookmark")).toContainText(
      "URL is required.",
    );
    await expectUnchanged(homebooks.bookmarkTree, [{ Empty: [] }]);
  });
});

test.describe("editing on the tile", () => {
  test("a Bookmark's title saves when the field loses focus", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1", "B2"));
    await homebooks.chooseItemMenuAction("B1", "Edit Bookmark...");

    const field = homebooks.page.getByRole("textbox", {
      name: "Bookmark title",
    });
    await field.fill("Renamed");
    await field.blur();

    await expect.poll(homebooks.bookmarkTree).toEqual(["Renamed", "B2"]);
  });

  test("a Bookmark's URL saves when the field loses focus", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    await homebooks.chooseItemMenuAction("B1", "Edit Bookmark...");

    const field = homebooks.page.getByRole("textbox", { name: "Bookmark URL" });
    await field.fill("https://moved.example/");
    await field.blur();

    await expect
      .poll(homebooks.bookmarkUrls)
      .toEqual({ B1: "https://moved.example/" });
  });

  test("an invalid URL keeps the previous one until a valid one replaces it", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    await homebooks.chooseItemMenuAction("B1", "Edit Bookmark...");
    const field = homebooks.page.getByRole("textbox", { name: "Bookmark URL" });

    await field.fill("not a url");
    await field.blur();
    await expectUnchanged(
      () => homebooks.bookmarkUrl("B1"),
      "https://b1.example/",
    );

    // The same field does save on blur, so the check above wasn't vacuous.
    await field.fill("https://moved.example/");
    await field.blur();
    await expect
      .poll(() => homebooks.bookmarkUrl("B1"))
      .toBe("https://moved.example/");
  });

  test("a Folder's title saves when the field loses focus", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks([
      { title: "Folder A", children: [] },
    ]);
    await homebooks.chooseItemMenuAction("Folder A", "Edit Folder");

    const field = homebooks.page.getByRole("textbox", { name: "Folder title" });
    await field.fill("Renamed");
    await field.blur();

    await expect.poll(homebooks.bookmarkTree).toEqual([{ Renamed: [] }]);
  });

  for (const key of ["Enter", "Escape"])
    test(`${key} neither saves nor ends editing`, async ({ openHomebooks }) => {
      const homebooks = await openHomebooks(bookmarks("B1"));
      await homebooks.chooseItemMenuAction("B1", "Edit Bookmark...");

      const field = homebooks.page.getByRole("textbox", {
        name: "Bookmark title",
      });
      await field.fill("Typed");
      await field.press(key);

      await expectUnchanged(homebooks.bookmarkTree, ["B1"]);
      await expect(field).toHaveValue("Typed");
    });
});
