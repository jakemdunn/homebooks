import type { BrowserContext, Worker } from "@playwright/test";
import { openHomepage, readShownItems } from "./support/homepage";
import { bookmarks, expect, test, urlFor } from "./support/extension";

/** Chromium's Other Bookmarks folder, found the way Homebooks finds it. */
const readOtherBookmarks = (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const [root] = await chrome.bookmarks.getTree();
    const other = root.children!.find((child) => child.folderType === "other")!;
    return { id: other.id, title: other.title };
  });

/** Adds a Bookmark to Other Bookmarks and returns that folder. */
const addToOtherBookmarks = async (serviceWorker: Worker, title: string) => {
  const other = await readOtherBookmarks(serviceWorker);
  await serviceWorker.evaluate(
    ({ parentId, title, url }) =>
      chrome.bookmarks.create({ parentId, title, url }),
    { parentId: other.id, title, url: urlFor(title) },
  );
  return other;
};

const readStoredSettings = (serviceWorker: Worker) =>
  serviceWorker.evaluate(() => chrome.storage.sync.get("settings"));

/**
 * Uncaught errors on any page, such as "Bookmark id is invalid.". Listens on
 * the context, so errors while a page first loads are caught too.
 */
const collectPageErrors = (context: BrowserContext) => {
  const errors: string[] = [];
  context.on("weberror", (webError) => errors.push(webError.error().message));
  return errors;
};

/** Opens Homebooks without seeding a Root Folder or setting one. */
const openFreshHomepage = (context: BrowserContext, serviceWorker: Worker) =>
  openHomepage(context, {
    url: new URL("/src/homepage.html", serviceWorker.url()).href,
    itemCount: 1,
  });

test.describe("with no Root Folder setting (a fresh profile)", () => {
  test("Homebooks shows Other Bookmarks, with no page error", async ({
    context,
    serviceWorker,
  }) => {
    await addToOtherBookmarks(serviceWorker, "Fallback");
    const errors = collectPageErrors(context);

    const page = await openFreshHomepage(context, serviceWorker);

    await expect
      .poll(() => readShownItems(page, serviceWorker))
      .toEqual(["Fallback"]);
    expect(errors).toEqual([]);
  });

  test("Settings shows Other Bookmarks as the Root Folder, without saving it", async ({
    context,
    serviceWorker,
  }) => {
    const other = await addToOtherBookmarks(serviceWorker, "Fallback");
    const page = await openFreshHomepage(context, serviceWorker);

    await page.getByRole("button", { name: "Settings" }).click();

    await expect(
      page.getByRole("button", {
        name: other.title,
        exact: true,
        pressed: true,
      }),
    ).toBeVisible();
    expect(await readStoredSettings(serviceWorker)).toEqual({});
  });

  test("picking the Other Bookmarks shown in Settings saves it", async ({
    context,
    serviceWorker,
  }) => {
    const other = await addToOtherBookmarks(serviceWorker, "Fallback");
    const page = await openFreshHomepage(context, serviceWorker);
    await page.getByRole("button", { name: "Settings" }).click();

    await page
      .getByRole("button", { name: other.title, exact: true, pressed: true })
      .click();

    await expect
      .poll(async () => (await readStoredSettings(serviceWorker)).settings)
      .toMatchObject({ rootFolder: other.id });
  });

  test("Add Folder creates the Folder in Other Bookmarks", async ({
    context,
    serviceWorker,
  }) => {
    const other = await addToOtherBookmarks(serviceWorker, "Fallback");
    const page = await openFreshHomepage(context, serviceWorker);

    await page.getByRole("button", { name: "Add Folder" }).click();
    const form = page.getByRole("dialog", { name: "New folder" });
    await expect(
      form.getByRole("button", {
        name: other.title,
        exact: true,
        pressed: true,
      }),
    ).toBeVisible();
    await form
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("Made");
    await form.getByRole("button", { name: "Save" }).click();

    await expect
      .poll(() =>
        serviceWorker.evaluate(
          async (id) =>
            (await chrome.bookmarks.getChildren(id)).map(({ title }) => title),
          other.id,
        ),
      )
      .toEqual(["Made", "Fallback"]);
  });
});

test("deleting the Root Folder falls back to Other Bookmarks, with no page error", async ({
  context,
  openHomebooks,
  serviceWorker,
}) => {
  await addToOtherBookmarks(serviceWorker, "Fallback");
  const errors = collectPageErrors(context);
  const homebooks = await openHomebooks(bookmarks("B1"));

  await serviceWorker.evaluate(async () => {
    const { settings } = (await chrome.storage.sync.get("settings")) as {
      settings: { rootFolder: string };
    };
    await chrome.bookmarks.removeTree(settings.rootFolder);
  });

  await expect.poll(homebooks.shownItems).toEqual(["Fallback"]);
  expect(errors).toEqual([]);
});
