import type { Page } from "@playwright/test";
import { drag } from "./support/drag";
import { expect, tabUrl, test } from "./support/extension";

/**
 * Adds a plain drop zone outside the app's drag surface that records what a
 * real native drop delivers. It reads the payload; it never creates one.
 */
const addDropRecorder = async (page: Page) => {
  await page.evaluate(() => {
    const zone = document.createElement("div");
    zone.setAttribute("aria-label", "Drop recorder");
    Object.assign(zone.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "200px",
      height: "120px",
      zIndex: "10000",
      background: "magenta",
    });
    zone.addEventListener("dragover", (event) => event.preventDefault());
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      const data = event.dataTransfer!;
      (window as unknown as { recorded: Record<string, string> }).recorded =
        Object.fromEntries(
          data.types.map((type) => [type, data.getData(type)]),
        );
    });
    document.documentElement.append(zone);
  });
  return {
    zone: page.getByLabel("Drop recorder"),
    recorded: () =>
      page.evaluate(
        () =>
          (window as unknown as { recorded?: Record<string, string> }).recorded,
      ),
  };
};

test("a Bookmark's payload", async ({ openHomebooks }) => {
  const { page, ids, item } = await openHomebooks([
    { title: "Example", url: "https://example.com/" },
  ]);
  const { zone, recorded } = await addDropRecorder(page);

  await drag(item("Example"), { onto: zone, at: "in" });

  await expect.poll(recorded).toMatchObject({
    "text/home-books-sources": JSON.stringify([`bookmark-${ids["Example"]}`]),
    "text/x-moz-url": "https://example.com/\nExample",
    "text/html": '<A HREF="https://example.com/">Example</A>',
    "text/plain": "https://example.com/",
  });
});

test("a Folder's payload lists its Bookmarks", async ({ openHomebooks }) => {
  const { page, ids, item } = await openHomebooks([
    {
      title: "Folder A",
      children: [
        { title: "One", url: "https://one.example/" },
        { title: "Two", url: "https://two.example/" },
      ],
    },
  ]);
  const { zone, recorded } = await addDropRecorder(page);

  await drag(item("Folder A").locator("header").first(), {
    onto: zone,
    at: "in",
  });

  await expect.poll(recorded).toMatchObject({
    "text/home-books-sources": JSON.stringify([`folder-${ids["Folder A"]}`]),
    "text/x-moz-url": "https://one.example/\nOne\nhttps://two.example/\nTwo",
    "text/html":
      '<A HREF="https://one.example/">One</A>\n<A HREF="https://two.example/">Two</A>',
    "text/plain": "https://one.example/, https://two.example/",
  });
});

test("a Tab's payload", async ({ openHomebooks }) => {
  const { page, openTabs, tab } = await openHomebooks([
    { title: "B1", url: "https://b1.example/" },
  ]);
  const { tabIds } = await openTabs(["Tab A"]);
  const { zone, recorded } = await addDropRecorder(page);
  const url = tabUrl("Tab A");

  await drag(tab(tabIds["Tab A"]), { onto: zone, at: "in" });

  await expect.poll(recorded).toMatchObject({
    "text/home-books-sources": JSON.stringify([`tab-${tabIds["Tab A"]}`]),
    "text/x-moz-url": `${url}\nTab A`,
    "text/html": `<A HREF="${url}">Tab A</A>`,
    "text/plain": url,
  });
});

test("a Window's payload lists its tabs", async ({ openHomebooks }) => {
  const { page, openTabs, windowHeader } = await openHomebooks([
    { title: "B1", url: "https://b1.example/" },
  ]);
  const { windowId } = await openTabs(["Tab 1", "Tab 2"]);
  const { zone, recorded } = await addDropRecorder(page);
  const [one, two] = [tabUrl("Tab 1"), tabUrl("Tab 2")];

  await drag(windowHeader(windowId), { onto: zone, at: "in" });

  await expect.poll(recorded).toMatchObject({
    "text/home-books-sources": JSON.stringify([`window-${windowId}`]),
    "text/x-moz-url": `${one}\nTab 1\n${two}\nTab 2`,
    "text/html": `<A HREF="${one}">Tab 1</A>\n<A HREF="${two}">Tab 2</A>`,
    "text/plain": `${one}, ${two}`,
  });
});
