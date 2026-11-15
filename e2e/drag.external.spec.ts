import type { Page } from "@playwright/test";
import { drag } from "./support/drag";
import { bookmarks, expect, expectRootFolder, test } from "./support/extension";

/**
 * Adds a plain link outside the app, standing in for a link on another page:
 * dragging it with real pointer input gives Chromium's own link payload
 * (text/uri-list, text/html, text/plain), as a drag from another tab would.
 */
const addLink = async (
  page: Page,
  { href, text }: { href: string; text: string },
) => {
  await page.evaluate(
    ({ href, text }) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = text;
      Object.assign(link.style, {
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        zIndex: "10000",
        padding: "1rem",
        background: "yellow",
      });
      document.documentElement.append(link);
    },
    { href, text },
  );
  return page.getByRole("link", { name: text, exact: true });
};

test("a link dragged from a page lands as a Bookmark at the Drop Position", async ({
  openHomebooks,
}) => {
  const homebooks = await openHomebooks(bookmarks("B1", "B2"));
  const link = await addLink(homebooks.page, {
    href: "https://elsewhere.example/",
    text: "Elsewhere",
  });

  await drag(link, { onto: homebooks.item("B1"), at: "right" });

  await expectRootFolder(homebooks, ["B1", "Elsewhere", "B2"]);
  expect(await homebooks.bookmarkUrl("Elsewhere")).toBe(
    "https://elsewhere.example/",
  );
});
