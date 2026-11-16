import type { BrowserContext, Page } from "@playwright/test";
import { bookmarks, expect, test } from "./support/extension";

type FirstRender = { firstText: string | null; sawEmptyState: boolean };

/**
 * Watches every page the context opens from before its first render: the
 * text of React's first commit to <body>, and whether the "No Bookmarks!"
 * screen ever shows. Observes the DOM only; no browser API is replaced.
 */
const watchFirstRender = (context: BrowserContext) =>
  context.addInitScript(() => {
    const state: FirstRender = { firstText: null, sawEmptyState: false };
    (window as unknown as { __firstRender: FirstRender }).__firstRender = state;
    new MutationObserver(() => {
      const text = document.body?.textContent ?? "";
      // The parser moves the page's <script> tags into <body>; React's
      // first commit is the first other element there.
      const rendered = [...(document.body?.children ?? [])].some(
        (child) => child.tagName !== "SCRIPT",
      );
      if (state.firstText === null && rendered) state.firstText = text;
      if (text.includes("No Bookmarks!")) state.sawEmptyState = true;
    }).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

const readFirstRender = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __firstRender: FirstRender }).__firstRender,
  );

const openNewTab = async (context: BrowserContext, url: string) => {
  const page = await context.newPage();
  await page.goto(url);
  return page;
};

test("a new tab shows the Root Folder's items on its first render", async ({
  context,
  openHomebooks,
}) => {
  await watchFirstRender(context);
  const homebooks = await openHomebooks([
    { title: "Folder", children: bookmarks("Inside") },
    ...bookmarks("B1"),
  ]);

  const page = await openNewTab(context, homebooks.page.url());
  await expect(page.getByText("B1", { exact: true })).toBeVisible();

  const { firstText, sawEmptyState } = await readFirstRender(page);
  expect(firstText).toContain("Folder");
  expect(firstText).toContain("B1");
  expect(sawEmptyState).toBe(false);
});

test("a first-ever load never flashes the No Bookmarks! screen", async ({
  context,
  openHomebooks,
}) => {
  await watchFirstRender(context);
  const homebooks = await openHomebooks(bookmarks("B1", "B2"));

  expect((await readFirstRender(homebooks.page)).sawEmptyState).toBe(false);
});

test("a new tab replaces cached bookmarks with the live ones", async ({
  context,
  openHomebooks,
  serviceWorker,
}) => {
  const homebooks = await openHomebooks(bookmarks("B1"));
  const url = homebooks.page.url();
  const b1 = homebooks.ids["B1"];
  await homebooks.page.close();
  await serviceWorker.evaluate(
    (id) => chrome.bookmarks.update(id, { title: "Renamed" }),
    b1,
  );

  const page = await openNewTab(context, url);

  await expect(page.getByText("Renamed", { exact: true })).toBeVisible();
  await expect(page.getByText("B1", { exact: true })).toHaveCount(0);
});

test("an empty Root Folder shows the No Bookmarks! screen", async ({
  context,
  openHomebooks,
  serviceWorker,
}) => {
  const homebooks = await openHomebooks(bookmarks("B1"));
  const url = homebooks.page.url();
  await homebooks.page.close();
  await serviceWorker.evaluate(
    (id) => chrome.bookmarks.remove(id),
    homebooks.ids["B1"],
  );

  const page = await openNewTab(context, url);

  await expect(page.getByText("No Bookmarks!")).toBeVisible();
});
