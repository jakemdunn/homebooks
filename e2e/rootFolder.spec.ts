import type { Page, Worker } from "@playwright/test";
import { openHomepage, readShownItems } from "./support/homepage";
import { bookmarks, expect, test, urlFor } from "./support/extension";

/** Chromium's "Other Bookmarks" folder, found the way Homebooks finds it. */
const readOtherBookmarks = (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const [root] = await chrome.bookmarks.getTree();
    const other = root.children!.find((child) => child.folderType === "other")!;
    return { id: other.id, title: other.title };
  });

const addToOtherBookmarks = (serviceWorker: Worker, title: string) =>
  serviceWorker.evaluate(
    async ({ title, url }) => {
      const [root] = await chrome.bookmarks.getTree();
      const other = root.children!.find(
        (child) => child.folderType === "other",
      )!;
      await chrome.bookmarks.create({ parentId: other.id, title, url });
    },
    { title, url: urlFor(title) },
  );

const readStoredSettings = (serviceWorker: Worker) =>
  serviceWorker.evaluate(() => chrome.storage.sync.get("settings"));

/** Uncaught errors on the page, such as "Bookmark id is invalid." */
const collectPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};

const homepageUrl = (serviceWorker: Worker) =>
  new URL("/src/homepage.html", serviceWorker.url()).href;

test.describe("with no Root Folder setting (a fresh profile)", () => {
  test("Homebooks shows Other Bookmarks", async ({
    context,
    serviceWorker,
  }) => {
    await addToOtherBookmarks(serviceWorker, "Fallback");

    const page = await openHomepage(context, {
      url: homepageUrl(serviceWorker),
      itemCount: 1,
    });
    const errors = collectPageErrors(page);

    await expect
      .poll(() => readShownItems(page, serviceWorker))
      .toEqual(["Fallback"]);
    expect(errors).toEqual([]);
  });

  test("Settings shows Other Bookmarks as the Root Folder, without saving it", async ({
    context,
    serviceWorker,
  }) => {
    await addToOtherBookmarks(serviceWorker, "Fallback");
    const other = await readOtherBookmarks(serviceWorker);
    const page = await openHomepage(context, {
      url: homepageUrl(serviceWorker),
      itemCount: 1,
    });

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

  test("Add Folder creates the Folder in Other Bookmarks", async ({
    context,
    serviceWorker,
  }) => {
    await addToOtherBookmarks(serviceWorker, "Fallback");
    const other = await readOtherBookmarks(serviceWorker);
    const page = await openHomepage(context, {
      url: homepageUrl(serviceWorker),
      itemCount: 1,
    });

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

test("deleting the Root Folder falls back to Other Bookmarks", async ({
  openHomebooks,
  serviceWorker,
}) => {
  await addToOtherBookmarks(serviceWorker, "Fallback");
  const homebooks = await openHomebooks(bookmarks("B1"));
  const errors = collectPageErrors(homebooks.page);

  await serviceWorker.evaluate(async () => {
    const { settings } = (await chrome.storage.sync.get("settings")) as {
      settings: { rootFolder: string };
    };
    await chrome.bookmarks.removeTree(settings.rootFolder);
  });

  await expect.poll(homebooks.shownItems).toEqual(["Fallback"]);
  expect(errors).toEqual([]);
});
