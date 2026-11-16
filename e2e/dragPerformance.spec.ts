import type { Page } from "@playwright/test";
import {
  bookmarks,
  expect,
  type HomebooksPage,
  test,
} from "./support/extension";
import { recordRenders, takeRenders } from "./support/renders";

const centerOf = async (homebooks: HomebooksPage, title: string) => {
  const box = (await homebooks.item(title).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/** Presses on `title` and moves just far enough to start a native drag. */
const startDragOn = async (homebooks: HomebooksPage, title: string) => {
  const start = await centerOf(homebooks, title);
  await homebooks.page.mouse.move(start.x, start.y);
  await homebooks.page.mouse.down();
  await homebooks.page.mouse.move(start.x + 10, start.y + 10, { steps: 2 });
};

/**
 * Waits until every Bookmark's Site Icon has been looked up: storing the
 * results re-renders the page, which would count against the drag. Each
 * seeded Bookmark has a host of its own.
 */
const waitForSiteIcons = (homebooks: HomebooksPage, hosts: number) =>
  expect
    // A hundred unresolvable hosts take a few seconds to fail.
    .poll(async () => (await homebooks.siteIconHosts()).length, {
      timeout: 20_000,
    })
    .toBe(hosts);

/** Waits until nothing is still rendering, then starts counting afresh. */
const settleRenders = (page: Page) =>
  expect
    .poll(async () => (await takeRenders(page)).length, { intervals: [100] })
    .toBe(0);

test.describe("mid-drag re-renders", () => {
  test("moving across tiles re-renders only the drop indicator", async ({
    context,
    openHomebooks,
  }) => {
    await recordRenders(context);
    const titles = Array.from({ length: 30 }, (_, i) => `B${i}`);
    const homebooks = await openHomebooks([
      { title: "F1", children: bookmarks("I1") },
      { title: "F2", children: bookmarks("I2") },
      ...bookmarks(...titles),
    ]);
    // The collapsed Folders' Bookmarks aren't shown, so aren't looked up.
    await waitForSiteIcons(homebooks, titles.length);
    const end = await centerOf(homebooks, "B20");
    await startDragOn(homebooks, "B0");
    await settleRenders(homebooks.page);

    await homebooks.page.mouse.move(end.x, end.y, { steps: 40 });
    const renders = await takeRenders(homebooks.page);
    await homebooks.page.mouse.up();

    expect(renders).toContain("DragIndicator");
    expect(renders.filter((name) => name !== "DragIndicator")).toEqual([]);
  });

  test("holding still re-renders nothing", async ({
    context,
    openHomebooks,
  }) => {
    await recordRenders(context);
    const homebooks = await openHomebooks(bookmarks("B1", "B2", "B3"));
    await waitForSiteIcons(homebooks, 3);
    const page = homebooks.page;
    const over = await centerOf(homebooks, "B3");
    await startDragOn(homebooks, "B1");
    await page.mouse.move(over.x, over.y, { steps: 10 });
    // Let the approach's last dragover land before counting.
    await page.mouse.move(over.x + 1, over.y);
    await settleRenders(page);

    // Chromium under Playwright fires dragover only on movement.
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(25);
      await page.mouse.move(over.x + (i % 2 ? 1 : -1), over.y);
    }
    const renders = await takeRenders(page);
    await page.mouse.up();

    expect(renders).toEqual([]);
  });

  /**
   * Chrome's split-view preview narrows the page dozens of times a second
   * while a drag nears the window edge. The browser's own layout per resize
   * is out of the app's hands; re-rendering in response to it isn't. Open
   * Folders rewrap as the page narrows, so their height changes too.
   */
  test("resizing the page re-renders nothing", async ({
    context,
    openHomebooks,
  }) => {
    await recordRenders(context);
    const inside = Array.from({ length: 20 }, (_, i) => `I${i}`);
    const titles = Array.from({ length: 80 }, (_, i) => `B${i}`);
    const homebooks = await openHomebooks(
      [
        { title: "Open", children: bookmarks(...inside) },
        ...bookmarks(...titles),
      ],
      { expanded: ["Open"], viewport: { width: 1400, height: 900 } },
    );
    // Only the open Folder's contents and the top level are shown.
    await waitForSiteIcons(homebooks, inside.length + titles.length);
    const page = homebooks.page;
    await startDragOn(homebooks, "B0");
    await settleRenders(page);

    for (let i = 0; i < 46; i++)
      await page.setViewportSize({ width: 1400 - i * 15, height: 900 });
    await page.waitForTimeout(100);
    const renders = await takeRenders(page);
    await page.mouse.up();

    expect(renders).toEqual([]);
  });
});
