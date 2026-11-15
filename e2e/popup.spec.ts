import {
  bookmarks,
  expect,
  expectRootFolder,
  ROOT_FOLDER_TITLE,
  tabUrl,
  test,
} from "./support/extension";

test.describe("the browser action popup", () => {
  test("prefills the active tab's title and URL", async ({ openHomebooks }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    const url = tabUrl("Saved Page");

    const popup = await homebooks.openPopup(url);

    await expect(
      popup.getByRole("heading", { name: "Add bookmark" }),
    ).toBeVisible();
    await expect(
      popup.getByRole("textbox", { name: "Title", exact: true }),
    ).toHaveValue("Saved Page");
    await expect(
      popup.getByRole("textbox", { name: "URL", exact: true }),
    ).toHaveValue(url);
  });

  test("Save adds the tab first in the Root Folder", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    const url = tabUrl("Saved Page");
    const popup = await homebooks.openPopup(url);
    // The form resets once its default parent loads (#48): wait for that.
    await expect(
      popup.getByRole("button", {
        name: ROOT_FOLDER_TITLE,
        exact: true,
        pressed: true,
      }),
    ).toBeVisible();

    await popup.getByRole("button", { name: "Save" }).click();

    await expectRootFolder(homebooks, ["Saved Page", "B1"]);
    expect(await homebooks.bookmarkUrl("Saved Page")).toBe(url);
  });

  test("on a browser page, explains why and opens Settings in Homebooks", async ({
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));

    const popup = await homebooks.openPopup("about:blank");
    await expect(
      popup.getByRole("heading", { name: "Can't add a bookmark for this tab" }),
    ).toBeVisible();
    await popup.getByRole("button", { name: "Open Settings" }).click();

    await expect(
      homebooks.page.getByRole("combobox", { name: "Context Menu" }),
    ).toBeVisible();
  });
});
