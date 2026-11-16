import type { BrowserContext, Page } from "@playwright/test";
import { bookmarks, expect, test } from "./support/extension";

type Recorded = { started: number; participants: string[][] };

/**
 * Records every view transition each page starts, and the names of the
 * elements taking part in it (its ::view-transition-group animations).
 * Wraps document.startViewTransition only to observe; it still runs.
 */
const recordViewTransitions = (context: BrowserContext) =>
  context.addInitScript(() => {
    const recorded: Recorded = { started: 0, participants: [] };
    (window as unknown as { __transitions: Recorded }).__transitions = recorded;
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((...args: Parameters<typeof start>) => {
      recorded.started++;
      const transition = start(...args);
      // Read a frame after the transition is ready, once the page has
      // settled which elements take part.
      transition.ready
        .then(() => new Promise(requestAnimationFrame))
        .then(() => {
          recorded.participants.push(
            document
              .getAnimations()
              .map(
                (animation) =>
                  (animation.effect as KeyframeEffect | null)?.pseudoElement,
              )
              .flatMap((pseudo) =>
                pseudo?.startsWith("::view-transition-group(")
                  ? [pseudo.slice("::view-transition-group(".length, -1)]
                  : [],
              ),
          );
        })
        .catch(() => {});
      return transition;
    }) as typeof document.startViewTransition;
  });

const readTransitions = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __transitions: Recorded }).__transitions,
  );

/**
 * Waits until the live bookmarks and settings have replaced any cached
 * copies: the last updates loading makes.
 */
const waitForLiveData = (page: Page) =>
  expect(page.locator('section[aria-busy="false"]').first()).toBeAttached();

test.describe("loading Homebooks", () => {
  test("starts no view transition on a first-ever load", async ({
    context,
    openHomebooks,
  }) => {
    await recordViewTransitions(context);
    const homebooks = await openHomebooks([
      { title: "Folder", children: bookmarks("Inside") },
      ...bookmarks("B1"),
    ]);
    await waitForLiveData(homebooks.page);

    expect((await readTransitions(homebooks.page)).started).toBe(0);
  });

  test("starts no view transition on a new tab", async ({
    context,
    openHomebooks,
  }) => {
    await recordViewTransitions(context);
    const homebooks = await openHomebooks(bookmarks("B1", "B2"));

    const page = await context.newPage();
    await page.goto(homebooks.page.url());
    await waitForLiveData(page);

    expect((await readTransitions(page)).started).toBe(0);
  });

  test("starts no view transition when storage differs from the page's copy", async ({
    context,
    openHomebooks,
    serviceWorker,
  }) => {
    await recordViewTransitions(context);
    const homebooks = await openHomebooks([
      { title: "Folder", children: bookmarks("Inside") },
    ]);
    const url = homebooks.page.url();
    await homebooks.page.close();
    // As if the Folder were expanded on another device.
    await serviceWorker.evaluate(
      (id) => chrome.storage.sync.set({ expanded: [id] }),
      homebooks.ids["Folder"],
    );

    const page = await context.newPage();
    await page.goto(url);
    await waitForLiveData(page);

    await expect(page.getByText("Inside", { exact: true })).toBeVisible();
    expect((await readTransitions(page)).started).toBe(0);
  });

  test("lets Add Folder be clicked straight away", async ({
    context,
    openHomebooks,
  }) => {
    const homebooks = await openHomebooks(bookmarks("B1"));
    const page = await context.newPage();
    await page.goto(homebooks.page.url());

    await page.getByRole("button", { name: "Add Folder" }).click();

    await expect(
      page.getByRole("dialog", { name: "New folder" }),
    ).toBeVisible();
  });
});

test("expanding a Folder animates only that Folder and what it moves", async ({
  context,
  openHomebooks,
}) => {
  await recordViewTransitions(context);
  const homebooks = await openHomebooks([
    ...bookmarks("Before"),
    { title: "Folder", children: bookmarks("Inside") },
    ...bookmarks("After"),
  ]);
  const folder = `folder-${homebooks.ids["Folder"]}`;
  const before = `bookmark-${homebooks.ids["Before"]}`;
  const { started } = await readTransitions(homebooks.page);

  await homebooks.item("Folder").getByText("1 Bookmark").click();
  await expect
    .poll(
      async () => (await readTransitions(homebooks.page)).participants.length,
    )
    .toBeGreaterThan(started);

  const participants = (await readTransitions(homebooks.page)).participants.at(
    -1,
  )!;
  // Names are the element's part, then its DragId: folder-folder-7.
  expect(participants).toContain(`folder-${folder}`);
  expect(participants).toContain(`contents-${folder}`);
  for (const unchanged of [
    "settings-header",
    "settings-panel",
    "bookmark-actions",
    "root",
    before,
  ])
    expect(participants).not.toContain(unchanged);
  expect(
    participants.filter((name) => /(^|-)(window|tab)-/.test(name)),
  ).toEqual([]);
});
